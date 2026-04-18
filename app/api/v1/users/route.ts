import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getOrgContext } from "@/lib/api/get-org-context";
import { checkPermission } from "@/lib/api/check-permission";
import { logger } from "@/lib/api/core/logger";
import type { IAMUser, GetUsersResponse, RoleRecord, UserStatus } from "@/types";
import type { Permission } from "@/types";

/**
 * GET /api/v1/users
 *
 * Returns all users in the current org with their roles and status.
 * orgId is read from x-org-id header.
 *
 * Query params:
 *   search?: string   — filter by email (case-insensitive)
 *   status?: UserStatus
 *   page?:   number   — default 1
 *   limit?:  number   — default 20
 *
 * @returns 200 { success: true, data: GetUsersResponse }
 * @returns 401 unauthorized
 * @returns 403 forbidden
 */
export async function GET(req: NextRequest) {
    const ctx = await getOrgContext(req);
    if (!ctx) {
        return NextResponse.json(
            { success: false, message: "Authentication required", data: null, error: { code: "UNAUTHORIZED" } },
            { status: 401 }
        );
    }

    const allowed = await checkPermission(ctx.userId, ctx.orgId, ["iam.manage"] as Permission[]);
    if (!allowed) {
        return NextResponse.json(
            { success: false, message: "You do not have permission to manage users", data: null, error: { code: "FORBIDDEN" } },
            { status: 403 }
        );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") as UserStatus | null;
    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip   = (page - 1) * limit;

    try {
        // Find all UserRole records in this org
        const userRoles = await prisma.userRole.findMany({
            where: { role: { orgId: ctx.orgId } },
            include: {
                user: true,
                role: true,
            },
        });

        // Group by userId — each user may have multiple roles
        const userMap = new Map<string, {
            user: typeof userRoles[0]["user"];
            roles: typeof userRoles[0]["role"][];
        }>();

        for (const ur of userRoles) {
            const existing = userMap.get(ur.userId);
            if (existing) {
                existing.roles.push(ur.role);
            } else {
                userMap.set(ur.userId, { user: ur.user, roles: [ur.role] });
            }
        }

        // Fetch OrgMember records for status (keyed by userId)
        const memberships = await prisma.orgMember.findMany({
            where:  { orgId: ctx.orgId, deletedAt: null },
            select: { userId: true, status: true, joinedAt: true },
        });
        const memberStatusMap = new Map(memberships.map((m) => [m.userId, m]));

        // Fetch invite records for this org
        const invites = await prisma.invite.findMany({
            where:  { orgId: ctx.orgId },
            select: { email: true, createdAt: true, acceptedAt: true },
        });
        const inviteMap = new Map(invites.map((i) => [i.email, i]));

        // Build IAMUser list
        let iamUsers: IAMUser[] = [];

        for (const [userId, { user, roles }] of userMap) {
            const member     = memberStatusMap.get(userId);
            const invite     = inviteMap.get(user.email);

            // Derive status
            let userStatus: UserStatus = "active";
            if (member?.status === "suspended") {
                userStatus = "suspended";
            } else if (member?.status === "pending") {
                userStatus = invite?.acceptedAt ? "active" : "invited";
            } else if (!member) {
                userStatus = invite?.acceptedAt ? "active" : "invited";
            }

            const roleRecords: RoleRecord[] = roles.map((r) => ({
                id:          r.id,
                name:        r.name,
                type:        r.type as "QUICK" | "SERVICE_BASED",
                serviceKey:  r.serviceKey,
                description: r.description,
                orgId:       r.orgId,
                permissions: r.permissions as Permission[],
            }));

            iamUsers.push({
                id:                 userId,
                name:               user.name,
                email:              user.email,
                avatar:             user.avatar,
                status:             userStatus,
                lastLogin:          user.lastLogin?.toISOString() ?? null,
                invitedAt:          invite?.createdAt?.toISOString() ?? null,
                invitationAccepted: invite?.acceptedAt !== null && invite?.acceptedAt !== undefined,
                roles:              roleRecords,
                roleCount:          roleRecords.length,
            });
        }

        // Apply search filter
        if (search) {
            const lower = search.toLowerCase();
            iamUsers = iamUsers.filter((u) =>
                u.email.toLowerCase().includes(lower) ||
                (u.name?.toLowerCase().includes(lower) ?? false)
            );
        }

        // Apply status filter
        if (status) {
            iamUsers = iamUsers.filter((u) => u.status === status);
        }

        const total    = iamUsers.length;
        const seatUsed = userMap.size;

        // Get seat limit from plan subscription
        let seatLimit: number | null = null;
        try {
            const subscription = await prisma.subscription.findUnique({
                where:   { orgId: ctx.orgId },
                include: { plan: true },
            });
            const limits = subscription?.plan?.limits as Record<string, unknown> | null;
            const entitlements = limits?.entitlements as Record<string, unknown> | null;
            if (entitlements && typeof entitlements.maxUsers === "number") {
                seatLimit = entitlements.maxUsers;
            }
        } catch {
            // Non-critical — continue without seat limit
        }

        // Paginate
        const paginatedUsers = iamUsers.slice(skip, skip + limit);

        const responseData: GetUsersResponse = {
            users:     paginatedUsers,
            total,
            seatUsed,
            seatLimit,
        };

        return NextResponse.json(
            { success: true, message: "Users loaded", data: responseData },
            { status: 200 }
        );

    } catch (error) {
        logger.error("[USERS] DB query failed", { orgId: ctx.orgId, error });
        return NextResponse.json(
            { success: false, message: "Failed to load users. Please try again.", data: null, error: { code: "INTERNAL_ERROR" } },
            { status: 500 }
        );
    }
}
