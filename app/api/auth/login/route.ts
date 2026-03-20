import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { comparePassword } from "@/server/auth/password";
import { generateAccessToken, generateRefreshToken, buildAuthCookies } from "@/server/auth/jwt";
import { loginSchema } from "@/lib/validations/auth.schema";
import type { UserRole } from "@/types";

/**
 * POST /api/auth/login
 * Validates credentials, checks email verification,
 * fetches org membership + permissions, returns auth cookies
 *
 * @returns 200 with user + org data and auth cookies set
 * @returns 400 if validation fails
 * @returns 401 if credentials are invalid
 * @returns 403 if email is not verified
 * @returns 500 on server error
 */
export async function POST(req: NextRequest) {
    try {
        // 1. Parse + validate
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

        // 5. Fetch active org membership + role + permissions
        const membership = await prisma.orgMember.findFirst({
            where: {
                userId: user.id,
                status: "active",
                deletedAt: null,
            },
            include: {
                org: true,
                role: true,
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

        // 6. Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        // 7. Generate tokens
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            orgId: membership.org.id,
            role: membership.role.name as UserRole,
            permissions,
        });

        const refreshToken = generateRefreshToken({
            userId: user.id,
            orgId: membership.org.id,
        });

        // 8. Return response with cookies
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
                        avatar: user.avatar,
                        role: membership.role.name,
                        permissions,
                        orgId: membership.org.id,
                        isVerified: user.isVerified,
                    },
                    org: {
                        id: membership.org.id,
                        name: membership.org.name,
                        slug: membership.org.slug,
                        logo: membership.org.logo,
                        plan: "free",
                    },
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