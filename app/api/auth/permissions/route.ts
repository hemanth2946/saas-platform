import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { verifyAccessToken } from "@/server/auth/jwt";
import { AUTH_CONSTANTS } from "@/config/auth.constants";
import { logger } from "@/lib/api/core/logger";
import type { Permission, UserRole } from "@/types";

// All valid permission strings — used to filter unknown values from DB
const VALID_PERMISSIONS = new Set<string>([
    "dashboard.view", "dashboard.edit",
    "iam.view", "iam.manage", "iam.invite", "iam.remove", "iam.role.assign",
    "billing.view", "billing.manage",
    "settings.view", "settings.edit", "settings.manage",
    "audit.view",
    "scan.view", "scan.create",
]);

/**
 * GET /api/auth/permissions
 *
 * Returns fresh permissions for the currently authenticated + org-scoped user.
 * Reads userId and orgId from the JWT (set after select-org).
 * Fetches ALL UserRole records for the user in the org and unions permissions.
 *
 * @returns 200 { permissions: Permission[], roles: UserRole[] }
 * @returns 401 if not authenticated or JWT is invalid / not org-scoped
 * @returns 403 if user has no roles in this org
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
                    data:    null,
                    error:   { code: "UNAUTHORIZED" },
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
                    data:    null,
                    error:   { code: "UNAUTHORIZED" },
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
                    data:    null,
                    error:   { code: "UNAUTHORIZED" },
                },
                { status: 401 }
            );
        }

        // 2. Fetch ALL UserRole records for this user in this org
        const userRoles = await prisma.userRole.findMany({
            where: {
                userId,
                role: { orgId },
            },
            include: { role: true },
        });

        if (userRoles.length === 0) {
            // Fall back to OrgMember check for backward compat during migration
            const membership = await prisma.orgMember.findFirst({
                where: { userId, orgId, status: "active", deletedAt: null },
                include: { role: true },
            });

            if (!membership) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "You do not have an active membership in this organisation",
                        data:    null,
                        error:   { code: "UNAUTHORIZED" },
                    },
                    { status: 401 }
                );
            }

            const perms = membership.role.permissions as string[];
            const validPerms = perms.filter((p) => VALID_PERMISSIONS.has(p)) as Permission[];
            const roleName   = membership.role.name as UserRole;

            return NextResponse.json(
                {
                    success: true,
                    message: "Permissions loaded",
                    data:    { permissions: validPerms, roles: [roleName] },
                },
                { status: 200 }
            );
        }

        // 3. Extract permissions from all roles, flatten and deduplicate
        const permissionSet = new Set<string>();
        const roleNames     = new Set<string>();

        for (const ur of userRoles) {
            const perms = ur.role.permissions as string[];
            roleNames.add(ur.role.name);
            for (const p of perms) {
                permissionSet.add(p);
            }
        }

        // 4. Validate permission strings — filter unknown values
        const rawPermissions = Array.from(permissionSet);
        const filteredOut    = rawPermissions.filter((p) => !VALID_PERMISSIONS.has(p));

        if (filteredOut.length > 0) {
            logger.warn("[PERMISSIONS] Filtered out unknown permissions", {
                userId,
                orgId,
                filteredOut,
            });
        }

        const validPermissions = rawPermissions.filter((p) =>
            VALID_PERMISSIONS.has(p)
        ) as Permission[];

        const roles = Array.from(roleNames) as UserRole[];

        // 5. Return deduplicated permissions + all role names
        return NextResponse.json(
            {
                success: true,
                message: "Permissions loaded",
                data:    { permissions: validPermissions, roles },
            },
            { status: 200 }
        );

    } catch (error) {
        const msg   = error instanceof Error ? error.message : String(error)
        const stack = error instanceof Error ? error.stack   : undefined
        logger.error("[PERMISSIONS ERROR]", { message: msg, stack })
        /* eslint-disable no-console */
        console.error("[PERMISSIONS ERROR]", msg, stack)
        /* eslint-enable no-console */
        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong. Please try again.",
                data:    null,
                error:   { code: "INTERNAL_ERROR" },
            },
            { status: 500 }
        );
    }
}
