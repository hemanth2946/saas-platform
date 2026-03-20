import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import {
    verifyRefreshToken,
    generateAccessToken,
    generateRefreshToken,
    buildAuthCookies,
} from "@/server/auth/jwt";
import { AUTH_CONSTANTS } from "@/config/auth.constants";
import type { UserRole } from "@/types";

/**
 * POST /api/auth/refresh
 * Validates refresh token cookie, issues new access + refresh tokens
 * Silent refresh — called automatically by Axios interceptor on 401
 *
 * @returns 200 with new auth cookies set
 * @returns 401 if refresh token is missing or invalid
 */
export async function POST(req: NextRequest) {
    try {
        // 1. Get refresh token from cookie
        const refreshToken = req.cookies.get(
            AUTH_CONSTANTS.COOKIES.REFRESH_TOKEN
        )?.value;

        if (!refreshToken) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No refresh token found",
                    data: null,
                    error: { code: "UNAUTHORIZED" },
                },
                { status: 401 }
            );
        }

        // 2. Verify refresh token
        const payload = verifyRefreshToken(refreshToken);

        // 3. Fetch fresh user + membership data
        const user = await prisma.user.findUnique({
            where: { id: payload.userId, deletedAt: null },
        });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "User not found",
                    data: null,
                    error: { code: "UNAUTHORIZED" },
                },
                { status: 401 }
            );
        }

        const membership = await prisma.orgMember.findFirst({
            where: {
                userId: user.id,
                orgId: payload.orgId,
                status: "active",
                deletedAt: null,
            },
            include: { role: true, org: true },
        });

        if (!membership) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No active membership found",
                    data: null,
                    error: { code: "UNAUTHORIZED" },
                },
                { status: 401 }
            );
        }

        const permissions = membership.role.permissions as string[];

        // 4. Issue new tokens
        const newAccessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            orgId: membership.org.id,
            role: membership.role.name as UserRole,
            permissions,
        });

        const newRefreshToken = generateRefreshToken({
            userId: user.id,
            orgId: membership.org.id,
        });

        // 5. Return with new cookies
        const cookies = buildAuthCookies(newAccessToken, newRefreshToken);
        const response = NextResponse.json(
            {
                success: true,
                message: "Token refreshed",
                data: null,
            },
            { status: 200 }
        );

        cookies.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
        return response;

    } catch (error) {
        console.error("[REFRESH ERROR]", error);
        return NextResponse.json(
            {
                success: false,
                message: "Session expired. Please log in again.",
                data: null,
                error: { code: "UNAUTHORIZED" },
            },
            { status: 401 }
        );
    }
}