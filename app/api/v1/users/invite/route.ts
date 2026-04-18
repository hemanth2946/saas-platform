import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getOrgContext } from "@/lib/api/get-org-context";
import { checkPermission } from "@/lib/api/check-permission";
import { writeAuditLog } from "@/lib/api/write-audit-log";
import { sendInviteEmail } from "@/server/auth/email";
import { logger } from "@/lib/api/core/logger";
import type { Permission } from "@/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const inviteSchema = z.object({
    email:   z.string().email("Enter a valid email address"),
    roleIds: z.array(z.string()).min(1, "Select at least one role"),
});

/**
 * POST /api/v1/users/invite
 *
 * Sends an invite to a new user with the specified roles.
 * Enforces seat limit from the org's plan entitlements.
 *
 * @returns 200 { success: true, data: { inviteId: string } }
 * @returns 400 seat limit reached / invalid roleIds
 * @returns 401 unauthorized
 * @returns 403 forbidden
 * @returns 409 user already a member / pending invite resent
 */
export async function POST(req: NextRequest) {
    const ctx = await getOrgContext(req);
    if (!ctx) {
        return NextResponse.json(
            { success: false, message: "Authentication required", data: null, error: { code: "UNAUTHORIZED" } },
            { status: 401 }
        );
    }

    const allowed = await checkPermission(ctx.userId, ctx.orgId, ["iam.invite"] as Permission[]);
    if (!allowed) {
        return NextResponse.json(
            { success: false, message: "You do not have permission to invite users", data: null, error: { code: "FORBIDDEN" } },
            { status: 403 }
        );
    }

    // Parse and validate body
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { success: false, message: "Invalid request body", data: null, error: { code: "VALIDATION_ERROR" } },
            { status: 400 }
        );
    }

    const parsed = inviteSchema.safeParse(body);
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

    const { email, roleIds } = parsed.data;

    try {
        // 1. Check seat limit
        const currentSeatCount = await prisma.userRole.findMany({
            where:    { role: { orgId: ctx.orgId } },
            distinct: ["userId"],
        });

        const subscription = await prisma.subscription.findUnique({
            where:   { orgId: ctx.orgId },
            include: { plan: true },
        });

        const limits       = subscription?.plan?.limits as Record<string, unknown> | null;
        const entitlements = limits?.entitlements as Record<string, unknown> | null;
        const maxUsers     = entitlements?.maxUsers;

        if (typeof maxUsers === "number" && currentSeatCount.length >= maxUsers) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Seat limit reached. Upgrade your plan to invite more users.",
                    data:    null,
                    error:   { code: "SEAT_LIMIT_EXCEEDED" },
                },
                { status: 400 }
            );
        }

        // 2. Validate all roleIds belong to this org
        const validRoles = await prisma.role.findMany({
            where: { id: { in: roleIds }, orgId: ctx.orgId },
        });

        if (validRoles.length !== roleIds.length) {
            return NextResponse.json(
                {
                    success: false,
                    message: "One or more selected roles are invalid",
                    data:    null,
                    error:   { code: "VALIDATION_ERROR" },
                },
                { status: 400 }
            );
        }

        // 3. Check if user already belongs to this org
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            const isMember = await prisma.userRole.findFirst({
                where: { userId: existingUser.id, role: { orgId: ctx.orgId } },
            });
            if (isMember) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "This user is already a member of your organization.",
                        data:    null,
                        error:   { code: "CONFLICT" },
                    },
                    { status: 409 }
                );
            }
        }

        // 4. Check for existing pending invite — resend if found
        const existingInvite = await prisma.invite.findFirst({
            where: { email, orgId: ctx.orgId, acceptedAt: null },
        });

        const token     = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

        let inviteId: string;

        if (existingInvite) {
            // Resend: update token + expiry + roleIds
            const updated = await prisma.invite.update({
                where: { id: existingInvite.id },
                data:  { token, expiresAt, roleIds },
            });
            inviteId = updated.id;
        } else {
            // 5. Create new invite
            const invite = await prisma.invite.create({
                data: {
                    email,
                    token,
                    orgId:      ctx.orgId,
                    roleIds,
                    invitedById: ctx.userId,
                    expiresAt,
                },
            });
            inviteId = invite.id;
        }

        // 6. Fetch org name + inviter name for the email
        const [org, inviter] = await Promise.all([
            prisma.org.findUnique({
                where:  { id: ctx.orgId },
                select: { name: true },
            }),
            prisma.user.findUnique({
                where:  { id: ctx.userId },
                select: { name: true },
            }),
        ]);
        const orgName     = org?.name     ?? "your organization";
        const inviterName = inviter?.name ?? "A team member";

        // 7. Send invite email
        try {
            const inviteUrl = `${APP_URL}/invite/${token}`;
            await sendInviteEmail({ email, orgName, inviterName, inviteUrl, expiresAt });
        } catch (emailErr) {
            // Non-fatal — invite record created, log the email failure
            logger.error("[INVITE] Failed to send invite email", { email, error: emailErr });
        }

        // 8. Audit log
        await writeAuditLog({
            orgId:      ctx.orgId,
            userId:     ctx.userId,
            action:     "user.invited",
            resource:   "invite",
            resourceId: inviteId,
            metadata:   { email, roleIds, invitedBy: ctx.userId },
        });

        return NextResponse.json(
            { success: true, message: "Invitation sent", data: { inviteId } },
            { status: 200 }
        );

    } catch (error) {
        logger.error("[INVITE] Failed to create invite", { orgId: ctx.orgId, error });
        return NextResponse.json(
            { success: false, message: "Failed to send invite. Please try again.", data: null, error: { code: "INTERNAL_ERROR" } },
            { status: 500 }
        );
    }
}
