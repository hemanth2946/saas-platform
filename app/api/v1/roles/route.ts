import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getOrgContext } from "@/lib/api/get-org-context";
import { checkPermission } from "@/lib/api/check-permission";
import { logger } from "@/lib/api/core/logger";
import type { RoleRecord, ServiceRoleGroup, GetRolesResponse } from "@/types";
import type { Permission } from "@/types";

/**
 * GET /api/v1/roles
 *
 * Returns all roles for the current org, grouped into Quick Roles
 * and Service-Based Roles. Used by the role selector in Create IAM User modal.
 *
 * @returns 200 { success: true, data: GetRolesResponse }
 * @returns 401 if not authenticated or no org context
 * @returns 403 if user lacks iam.manage or iam.invite permission
 */
export async function GET(req: NextRequest) {
    const ctx = await getOrgContext(req);
    if (!ctx) {
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

    const allowed = await checkPermission(ctx.userId, ctx.orgId, [
        "iam.manage",
        "iam.invite",
    ] as Permission[]);

    if (!allowed) {
        return NextResponse.json(
            {
                success: false,
                message: "You do not have permission to view roles",
                data:    null,
                error:   { code: "FORBIDDEN" },
            },
            { status: 403 }
        );
    }

    try {
        const roles = await prisma.role.findMany({
            where:   { orgId: ctx.orgId },
            orderBy: [{ type: "asc" }, { name: "asc" }],
        });

        const quickRoles: RoleRecord[] = [];
        const serviceMap = new Map<string, RoleRecord[]>();

        for (const role of roles) {
            const record: RoleRecord = {
                id:          role.id,
                name:        role.name,
                type:        role.type as "QUICK" | "SERVICE_BASED",
                serviceKey:  role.serviceKey,
                description: role.description,
                orgId:       role.orgId,
                permissions: role.permissions as Permission[],
            };

            if (role.type === "QUICK") {
                quickRoles.push(record);
            } else {
                const key = role.serviceKey ?? "other";
                const existing = serviceMap.get(key) ?? [];
                existing.push(record);
                serviceMap.set(key, existing);
            }
        }

        // Build service groups with human-readable names
        const SERVICE_NAMES: Record<string, { name: string; description: string }> = {
            "risk-overview":          { name: "Risk Overview",           description: "Access to risk overview dashboard and exports" },
            "network-perimeter":      { name: "Network Perimeter",       description: "Network perimeter scanning and management" },
            "cloud-workload":         { name: "Cloud Workload",          description: "Cloud workload scanning and management" },
            "code-security":          { name: "Code Security",           description: "Code security scanning and management" },
            "cloud-security-posture": { name: "Cloud Security Posture",  description: "Cloud security posture management and exports" },
        };

        const serviceBased: ServiceRoleGroup[] = [];
        for (const [serviceKey, serviceRoles] of serviceMap) {
            const meta = SERVICE_NAMES[serviceKey] ?? {
                name:        serviceKey,
                description: `Roles for ${serviceKey}`,
            };
            serviceBased.push({
                serviceKey,
                serviceName: meta.name,
                description: meta.description,
                roles:       serviceRoles,
            });
        }

        const responseData: GetRolesResponse = { quickRoles, serviceBased };

        return NextResponse.json(
            { success: true, message: "Roles loaded", data: responseData },
            { status: 200 }
        );

    } catch (error) {
        logger.error("[ROLES] DB query failed", { orgId: ctx.orgId, error });
        return NextResponse.json(
            {
                success: false,
                message: "Failed to load roles. Please try again.",
                data:    null,
                error:   { code: "INTERNAL_ERROR" },
            },
            { status: 500 }
        );
    }
}
