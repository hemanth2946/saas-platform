import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getOrgContext } from "@/lib/api/get-org-context";
import { checkPermission } from "@/lib/api/check-permission";
import { writeAuditLog } from "@/lib/api/write-audit-log";
import { logger } from "@/lib/api/core/logger";
import type { Permission } from "@/types";

type RouteParams = { params: Promise<{ userId: string }> };

// ── PATCH schema ──────────────────────────────────────────────────────────────

const patchSchema = z.object({
    roleIds: z.array(z.string()).min(1).optional(),
    status:  z.enum(["ACTIVE", "SUSPENDED"]).optional(),
}).refine(
    (data) => data.roleIds !== undefined || data.status !== undefined,
    { message: "Provide roleIds or status to update" }
);

/**
 * PATCH /api/v1/users/:userId
 *
 * Updates a user's roles and/or status in the current org.
 * Uses a transaction for role updates to prevent partial writes.
 * Prevents self-modification.
 *
 * @returns 200 { success: true, data: { userId, updated: string[] } }
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    const { userId: targetUserId } = await params;

    const ctx = await getOrgContext(req);
    if (!ctx) {
        return NextResponse.json(
            { success: false, message: "Authentication required", data: null, error: { code: "UNAUTHORIZED" } },
            { status: 401 }
        );
    }

    if (targetUserId === ctx.userId) {
        return NextResponse.json(
            { success: false, message: "You cannot modify your own account", data: null, error: { code: "VALIDATION_ERROR" } },
            { status: 400 }
        );
    }

    const allowed = await checkPermission(ctx.userId, ctx.orgId, ["iam.manage"] as Permission[]);
    if (!allowed) {
        return NextResponse.json(
            { success: false, message: "You do not have permission to manage users", data: null, error: { code: "FORBIDDEN" } },
            { status: 403 }
        );
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { success: false, message: "Invalid request body", data: null, error: { code: "VALIDATION_ERROR" } },
            { status: 400 }
        );
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            {
                success: false,
                message: parsed.error.issues[0]?.message ?? "Validation failed",
                data:    null,
                error:   { code: "VALIDATION_ERROR", details: parsed.error.issues },
            },
            { status: 400 }
        );
    }

    const { roleIds, status } = parsed.data;

    try {
        // Validate target user belongs to this org
        const targetMembership = await prisma.userRole.findFirst({
            where: { userId: targetUserId, role: { orgId: ctx.orgId } },
        });
        if (!targetMembership) {
            return NextResponse.json(
                { success: false, message: "User not found in this organisation", data: null, error: { code: "NOT_FOUND" } },
                { status: 404 }
            );
        }

        const updated: string[] = [];

        // 6A — Role update (atomic transaction)
        if (roleIds !== undefined) {
            // Validate all roleIds belong to this org
            const validRoles = await prisma.role.findMany({
                where: { id: { in: roleIds }, orgId: ctx.orgId },
            });
            if (validRoles.length !== roleIds.length) {
                return NextResponse.json(
                    { success: false, message: "One or more roles are invalid", data: null, error: { code: "VALIDATION_ERROR" } },
                    { status: 400 }
                );
            }

            // Get previous roles for audit log
            const previousRoles = await prisma.userRole.findMany({
                where: { userId: targetUserId, role: { orgId: ctx.orgId } },
                select: { roleId: true },
            });
            const previousRoleIds = previousRoles.map((r) => r.roleId);

            // Atomic replace: delete old → create new
            await prisma.$transaction([
                prisma.userRole.deleteMany({
                    where: {
                        userId: targetUserId,
                        role:   { orgId: ctx.orgId },
                    },
                }),
                prisma.userRole.createMany({
                    data: roleIds.map((roleId) => ({
                        userId:    targetUserId,
                        roleId,
                    })),
                }),
            ]);

            updated.push("roles");

            await writeAuditLog({
                orgId:      ctx.orgId,
                userId:     ctx.userId,
                action:     "user.roles_updated",
                resource:   "user",
                resourceId: targetUserId,
                metadata:   { previousRoleIds, newRoleIds: roleIds, updatedBy: ctx.userId },
            });
        }

        // 6B — Status update
        if (status !== undefined) {
            const memberStatus = status === "ACTIVE" ? "active" : "suspended";

            await prisma.orgMember.updateMany({
                where: { userId: targetUserId, orgId: ctx.orgId },
                data:  { status: memberStatus },
            });

            // If suspending: invalidate active sessions by clearing reset token
            // (forces re-login on next token refresh attempt)
            if (status === "SUSPENDED") {
                await prisma.user.update({
                    where: { id: targetUserId },
                    data:  { resetToken: null, resetTokenExp: null },
                });
            }

            updated.push("status");

            const action = status === "SUSPENDED" ? "user.suspended" : "user.unsuspended";
            await writeAuditLog({
                orgId:      ctx.orgId,
                userId:     ctx.userId,
                action,
                resource:   "user",
                resourceId: targetUserId,
                metadata:   { [status === "SUSPENDED" ? "suspendedBy" : "unsuspendedBy"]: ctx.userId },
            });
        }

        return NextResponse.json(
            { success: true, message: "User updated", data: { userId: targetUserId, updated } },
            { status: 200 }
        );

    } catch (error) {
        logger.error("[USERS PATCH] Failed to update user", { userId: targetUserId, error });
        return NextResponse.json(
            { success: false, message: "Failed to update user. Please try again.", data: null, error: { code: "INTERNAL_ERROR" } },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/v1/users/:userId
 *
 * Removes a user from the current org by deleting all their UserRole records.
 * Does NOT delete the User account (user may belong to other orgs).
 * Prevents self-removal.
 *
 * @returns 200 { success: true, data: { userId } }
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    const { userId: targetUserId } = await params;

    const ctx = await getOrgContext(req);
    if (!ctx) {
        return NextResponse.json(
            { success: false, message: "Authentication required", data: null, error: { code: "UNAUTHORIZED" } },
            { status: 401 }
        );
    }

    if (targetUserId === ctx.userId) {
        return NextResponse.json(
            { success: false, message: "You cannot remove yourself from the organization", data: null, error: { code: "VALIDATION_ERROR" } },
            { status: 400 }
        );
    }

    const allowed = await checkPermission(ctx.userId, ctx.orgId, ["iam.manage"] as Permission[]);
    if (!allowed) {
        return NextResponse.json(
            { success: false, message: "You do not have permission to remove users", data: null, error: { code: "FORBIDDEN" } },
            { status: 403 }
        );
    }

    try {
        // Validate target user belongs to this org
        const targetUser = await prisma.user.findUnique({
            where:  { id: targetUserId },
            select: { id: true, email: true },
        });

        if (!targetUser) {
            return NextResponse.json(
                { success: false, message: "User not found", data: null, error: { code: "NOT_FOUND" } },
                { status: 404 }
            );
        }

        const isMember = await prisma.userRole.findFirst({
            where: { userId: targetUserId, role: { orgId: ctx.orgId } },
        });

        if (!isMember) {
            return NextResponse.json(
                { success: false, message: "User is not a member of this organisation", data: null, error: { code: "NOT_FOUND" } },
                { status: 404 }
            );
        }

        // Remove all UserRole records for this user in this org
        await prisma.userRole.deleteMany({
            where: {
                userId: targetUserId,
                role:   { orgId: ctx.orgId },
            },
        });

        // Remove OrgMember record too (keep data consistent)
        await prisma.orgMember.deleteMany({
            where: { userId: targetUserId, orgId: ctx.orgId },
        });

        // Delete any pending invites for this user's email in this org
        await prisma.invite.deleteMany({
            where: { email: targetUser.email, orgId: ctx.orgId, acceptedAt: null },
        });

        await writeAuditLog({
            orgId:      ctx.orgId,
            userId:     ctx.userId,
            action:     "user.removed",
            resource:   "user",
            resourceId: targetUserId,
            metadata:   { removedEmail: targetUser.email, removedBy: ctx.userId },
        });

        return NextResponse.json(
            { success: true, message: "User removed from organisation", data: { userId: targetUserId } },
            { status: 200 }
        );

    } catch (error) {
        logger.error("[USERS DELETE] Failed to remove user", { userId: targetUserId, error });
        return NextResponse.json(
            { success: false, message: "Failed to remove user. Please try again.", data: null, error: { code: "INTERNAL_ERROR" } },
            { status: 500 }
        );
    }
}
