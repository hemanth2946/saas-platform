/**
 * lib/api/write-audit-log.ts
 *
 * Fire-and-forget audit log writer.
 * Called after every successful mutating operation in protected routes.
 *
 * Never throws — failures are logged but never crash the main operation.
 *
 * @example
 * await writeAuditLog({
 *   orgId:      ctx.orgId,
 *   userId:     ctx.userId,
 *   action:     "user.invited",
 *   resource:   "invite",
 *   resourceId: invite.id,
 *   metadata:   { email, roleIds },
 * })
 */

import { prisma } from "@/server/db";
import { logger } from "@/lib/api/core/logger";

interface AuditLogParams {
    orgId:      string;
    userId:     string;
    action:     string;
    resource:   string;
    resourceId: string;
    metadata?:  Record<string, unknown>;
}

export async function writeAuditLog(params: AuditLogParams): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                orgId:      params.orgId,
                userId:     params.userId,
                action:     params.action,
                resource:   params.resource,
                resourceId: params.resourceId,
                metadata:   (params.metadata ?? {}) as object,
            },
        });
    } catch (error) {
        // Audit log failure must NEVER crash the main operation
        logger.error("[AUDIT LOG] Failed to write audit log entry", {
            action:     params.action,
            resourceId: params.resourceId,
            error,
        });
    }
}
