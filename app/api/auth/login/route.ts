import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { comparePassword } from "@/server/auth/password";
import { generateAccessToken, generateRefreshToken, buildAuthCookies } from "@/server/auth/jwt";
import { loginSchema } from "@/lib/validations/auth.schema";

/**
 * POST /api/auth/login
 *
 * Phase 2 behaviour:
 * - Validates credentials + email verification
 * - Fetches ALL active org memberships for the user
 * - Issues a JWT with orgId = "" (no org selected yet)
 * - Returns { user, orgs[] } — org selection happens at /select-org
 *
 * @returns 200 { user: { id, name, email, avatar, isVerified }, orgs: OrgSummary[] }
 * @returns 400 if validation fails
 * @returns 401 if credentials are invalid or email not verified
 * @returns 400 if user belongs to no active orgs
 * @returns 500 on server error
 */
export async function POST(req: NextRequest) {
    try {
        // 1. Parse + validate input
        const body = await req.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Validation failed",
                    data: null,
                    error: {
                        code: "VALIDATION_ERROR",
                        fieldErrors: parsed.error.flatten().fieldErrors,
                    },
                },
                { status: 400 }
            );
        }

        const { email, password } = parsed.data;

        // 2. Find user
        const user = await prisma.user.findUnique({
            where: { email, deletedAt: null },
        });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid email or password",
                    data: null,
                    error: { code: "UNAUTHORIZED" },
                },
                { status: 401 }
            );
        }

        // 3. Verify password
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid email or password",
                    data: null,
                    error: { code: "UNAUTHORIZED" },
                },
                { status: 401 }
            );
        }

        // 4. Require email verification
        if (!user.isVerified) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please verify your email before logging in",
                    data: null,
                    error: { code: "FORBIDDEN" },
                },
                { status: 401 }
            );
        }

        // 5. Fetch all active org memberships for this user
        const memberships = await prisma.orgMember.findMany({
            where: {
                userId: user.id,
                status: "active",
                deletedAt: null,
                org: { deletedAt: null },
            },
            include: {
                org: {
                    include: {
                        subscription: { include: { plan: true } },
                        _count: { select: { members: { where: { status: "active", deletedAt: null } } } },
                    },
                },
                role: true,
            },
        });

        if (memberships.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Your account is not associated with any organization. Contact your admin.",
                    data: null,
                    error: { code: "FORBIDDEN" },
                },
                { status: 400 }
            );
        }

        // 6. Update last login timestamp
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        // 7. Issue a pre-org token (orgId = "", role = "", no permissions)
        //    Org scoping happens after /api/auth/select-org
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            orgId: "",
            role: "",
            permissions: [],
        });

        const refreshToken = generateRefreshToken({
            userId: user.id,
            orgId: "",
        });

        // 8. Build enriched org summary list for the client
        const orgs = memberships.map((m) => ({
            id: m.org.id,
            name: m.org.name,
            slug: m.org.slug,
            logo: m.org.logo ?? null,
            plan: m.org.subscription?.plan.name ?? "free",
            role: m.role.name,
            memberCount: m.org._count.members,
        }));

        // 9. Return response with auth cookies set
        const cookies = buildAuthCookies(accessToken, refreshToken);
        const response = NextResponse.json(
            {
                success: true,
                message: "Logged in successfully",
                data: {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        avatar: user.avatar ?? null,
                        isVerified: user.isVerified,
                        lastLogin: user.lastLogin?.toISOString() ?? null,
                    },
                    orgs,
                },
            },
            { status: 200 }
        );

        cookies.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
        return response;

    } catch (error) {
        console.error("[LOGIN ERROR]", error);
        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong. Please try again.",
                data: null,
                error: { code: "INTERNAL_ERROR" },
            },
            { status: 500 }
        );
    }
}
