import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { comparePassword } from "@/server/auth/password";
import { generateAccessToken, generateRefreshToken, buildAuthCookies } from "@/server/auth/jwt";
import { loginSchema } from "@/lib/validations/auth.schema";
import type { UserRole } from "@/types";

/**
 * POST /api/auth/login
 * Validates credentials, checks email verification,
 * fetches org membership + role + permissions + subscription plan,
 * returns complete auth cookies and correctly typed response.
 *
 * @returns 200 with user + org + plan data and auth cookies set
 * @returns 400 if validation fails
 * @returns 401 if credentials are invalid
 * @returns 403 if email not verified or no active org membership
 * @returns 500 on server error
 */
export async function POST(req: NextRequest) {
    try {
        // 1. Parse + validate request body
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

        // 2. Find user by email
        // Use findFirst (not findUnique) so we can filter on deletedAt
        // without violating Prisma's unique-fields-only constraint on findUnique.
        const user = await prisma.user.findFirst({
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

        // 3. Check password
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

        // 4. Check email verification
        if (!user.isVerified) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please verify your email before logging in",
                    data: null,
                    error: { code: "FORBIDDEN" },
                },
                { status: 403 }
            );
        }

        // 5. Fetch active org membership with role, org, and subscription plan
        const membership = await prisma.orgMember.findFirst({
            where: {
                userId: user.id,
                status: "active",
                deletedAt: null,
            },
            include: {
                role: true,
                org: {
                    include: {
                        subscription: {
                            include: {
                                plan: true,
                            },
                        },
                    },
                },
            },
        });

        if (!membership) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No active organisation found for this account",
                    data: null,
                    error: { code: "FORBIDDEN" },
                },
                { status: 403 }
            );
        }

        const permissions = membership.role.permissions as string[];

        // 6. Resolve the org's current plan name from subscription
        // Falls back to "free" if no subscription record exists
        const planName = membership.org.subscription?.plan.name ?? "free";

        // 7. Update last login timestamp
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        // 8. Generate JWT tokens
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            orgId: membership.org.id,
            orgSlug: membership.org.slug,
            role: membership.role.name as UserRole,
            permissions,
        });

        const refreshToken = generateRefreshToken({
            userId: user.id,
            orgId: membership.org.id,
        });

        // 9. Build response — shape must exactly match OrgContext and SessionUser types
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
                        role: membership.role.name as UserRole,
                        permissions,
                        orgId: membership.org.id,
                        isVerified: user.isVerified,
                        lastLogin: user.lastLogin?.toISOString() ?? null,
                    },
                    org: {
                        id: membership.org.id,
                        name: membership.org.name,
                        slug: membership.org.slug,
                        logo: membership.org.logo ?? null,
                        domain: membership.org.domain ?? null,
                        timezone: membership.org.timezone,
                        plan: planName,
                        createdAt: membership.org.createdAt.toISOString(),
                    },
                    plan: planName,
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
