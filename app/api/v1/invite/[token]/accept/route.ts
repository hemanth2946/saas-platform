import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import { writeAuditLog } from "@/lib/api/write-audit-log";
import { logger } from "@/lib/api/core/logger";

type RouteParams = { params: Promise<{ token: string }> };

const acceptSchema = z.object({
    name:     z.string().min(2, "Name must be at least 2 characters").max(100),
    password: z.string()
               .min(8, "Password must be at least 8 characters")
               .regex(/[A-Z]/, "Password must contain an uppercase letter")
               .regex(/[0-9]/, "Password must contain a number"),
});

/**
 * POST /api/v1/invite/:token/accept
 *
 * PUBLIC ROUTE — no auth required.
 * Creates a new user (or adds existing user to org) and accepts the invite.
 * All writes are wrapped in a transaction.
 *
 * @returns 200 { success: true, data: { message: string } }
 * @returns 400 validation error
 * @returns 404 invite not found
 * @returns 409 already accepted
 * @returns 410 expired
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
    const { token } = await params;

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { success: false, message: "Invalid request body", data: null, error: { code: "VALIDATION_ERROR" } },
            { status: 400 }
        );
    }

    const parsed = acceptSchema.safeParse(body);
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

    const { name, password } = parsed.data;

    try {
        // 1. Fetch and validate invite
        const invite = await prisma.invite.findUnique({
            where:   { token },
            include: { org: { select: { id: true, name: true } } },
        });

        if (!invite) {
            return NextResponse.json(
                { success: false, message: "Invite link is invalid", data: null, error: { code: "NOT_FOUND", reason: "INVITE_NOT_FOUND" } },
                { status: 404 }
            );
        }

        if (invite.acceptedAt !== null) {
            return NextResponse.json(
                { success: false, message: "This invite has already been accepted", data: null, error: { code: "CONFLICT", reason: "INVITE_ALREADY_ACCEPTED" } },
                { status: 409 }
            );
        }

        if (invite.expiresAt < new Date()) {
            return NextResponse.json(
                { success: false, message: "This invite has expired. Contact your admin.", data: null, error: { code: "VALIDATION_ERROR", reason: "INVITE_EXPIRED" } },
                { status: 410 }
            );
        }

        // 2. Validate roleIds still exist in the org
        const validRoles = await prisma.role.findMany({
            where: { id: { in: invite.roleIds }, orgId: invite.orgId },
            select: { id: true },
        });
        const validRoleIds = validRoles.map((r) => r.id);

        // 3. Upsert user + assign roles + mark invite accepted (transaction)
        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await prisma.$transaction(async (tx) => {
            // Check if user already exists
            let user = await tx.user.findUnique({ where: { email: invite.email } });

            if (!user) {
                user = await tx.user.create({
                    data: {
                        email:      invite.email,
                        name,
                        password:   hashedPassword,
                        isVerified: true, // Invite acceptance verifies email
                        lastLogin:  new Date(),
                    },
                });
            }

            // Assign roles (skip duplicates via skipDuplicates)
            if (validRoleIds.length > 0) {
                await tx.userRole.createMany({
                    data:           validRoleIds.map((roleId) => ({ userId: user!.id, roleId })),
                    skipDuplicates: true,
                });

                // Also create/update OrgMember record for status tracking
                const primaryRoleId = validRoleIds[0];
                if (primaryRoleId) {
                    await tx.orgMember.upsert({
                        where:  { userId_orgId: { userId: user!.id, orgId: invite.orgId } },
                        update: { status: "active", roleId: primaryRoleId },
                        create: {
                            userId:  user!.id,
                            orgId:   invite.orgId,
                            roleId:  primaryRoleId,
                            status:  "active",
                        },
                    });
                }
            }

            // Mark invite as accepted
            await tx.invite.update({
                where: { token },
                data:  { acceptedAt: new Date() },
            });

            return user;
        });

        // 4. Write audit log (outside transaction — non-fatal)
        await writeAuditLog({
            orgId:      invite.orgId,
            userId:     result.id,
            action:     "user.joined",
            resource:   "user",
            resourceId: result.id,
            metadata:   { email: invite.email, orgId: invite.orgId, roleIds: validRoleIds },
        });

        return NextResponse.json(
            { success: true, message: "Account created successfully", data: { message: "Account created successfully" } },
            { status: 200 }
        );

    } catch (error) {
        logger.error("[INVITE ACCEPT] Failed to accept invite", { token, error });
        return NextResponse.json(
            { success: false, message: "Failed to accept invite. Please try again.", data: null, error: { code: "INTERNAL_ERROR" } },
            { status: 500 }
        );
    }
}
