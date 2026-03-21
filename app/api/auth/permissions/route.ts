import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { verifyAccessToken } from "@/server/auth/jwt";
import { AUTH_CONSTANTS } from "@/config/auth.constants";
import type { UserRole } from "@/types";

/**
 * GET /api/auth/permissions
 *
 * Returns fresh permissions for the currently authenticated + org-scoped user.
 * Reads userId and orgId from the JWT (set after select-org).
 * Always queries the DB — never returns stale token data.
 *
 * @returns 200 { permissions: string[], role: UserRole }
 * @returns 401 if not authenticated or JWT is invalid
 * @returns 403 if user has no role in this org
 * @returns 500 on server error
 */
export async function GET(req: NextRequest) {
    try {
        // 1. Read and verify access token
        const accessTokenCookie = req.cookies.get(AUTH_CONSTANTS.COOKIES.ACCESS_TOKEN);
        if (!accessTokenCookie?.value) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Authentication required",
                    data: null,
                    error: { code: "UNAUTHORIZED" },
                },
                { status: 401 }
            );
        }

        let jwtPayload;
        try {
            jwtPayload = verifyAccessToken(accessTokenCookie.value);
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid or expired session",
                    data: null,
                    error: { code: "UNAUTHORIZED" },
                },
                { status: 401 }
            );
        }

        const { userId, orgId } = jwtPayload;

        // Must be org-scoped — orgId cannot be empty
        if (!orgId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No organisation selected",
                    data: null,
                    error: { code: "UNAUTHORIZED" },
                },
                { status: 401 }
            );
        }

        // 2. Fetch the user's active membership + role for this org
        const membership = await prisma.orgMember.findFirst({
            where: {
                userId,
                orgId,
                status: "active",
                deletedAt: null,
            },
            include: {
                role: true,
            },
        });

        if (!membership) {
            return NextResponse.json(
                {
                    success: false,
                    message: "You do not have an active membership in this organisation",
                    data: null,
                    error: { code: "UNAUTHORIZED" },
                },
                { status: 401 }
            );
        }

        const { role } = membership;

        // 3. Validate role belongs to this org
        if (role.orgId !== orgId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Role configuration missing. Contact your admin.",
                    data: null,
                    error: { code: "FORBIDDEN" },
                },
                { status: 403 }
            );
        }

        const permissions = role.permissions as string[];

        // 4. Return fresh permissions + role from DB
        return NextResponse.json(
            {
                success: true,
                message: "Permissions loaded",
                data: {
                    permissions,
                    role: role.name as UserRole,
                },
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("[PERMISSIONS ERROR]", error);
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
