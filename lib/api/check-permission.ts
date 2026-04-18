/**
 * lib/api/check-permission.ts
 *
 * Permission guard utility for protected API routes.
 * Fetches all UserRole records for the user in the org,
 * flattens permissions from all roles, and checks if ANY
 * of the required permissions is present.
 *
 * @example
 * const allowed = await checkPermission(ctx.userId, ctx.orgId, ["iam.manage"])
 * if (!allowed) return NextResponse.json({ ... }, { status: 403 })
 */

import { prisma } from "@/server/db";
import type { Permission } from "@/types";

/**
 * Returns true if the user has AT LEAST ONE of the required permissions
 * in the given org (union across all their roles).
 *
 * Never throws — returns false on any DB error.
 */
export async function checkPermission(
    userId:               string,
    orgId:                string,
    requiredPermissions:  Permission[]
): Promise<boolean> {
    try {
        const userRoles = await prisma.userRole.findMany({
            where: {
                userId,
                role: { orgId },
            },
            include: { role: true },
        });

        if (userRoles.length === 0) return false;

        // Flatten all permissions from all roles into a Set
        const permissionSet = new Set<string>();
        for (const ur of userRoles) {
            const perms = ur.role.permissions as string[];
            for (const p of perms) {
                permissionSet.add(p);
            }
        }

        return requiredPermissions.some((p) => permissionSet.has(p));
    } catch {
        return false;
    }
}
