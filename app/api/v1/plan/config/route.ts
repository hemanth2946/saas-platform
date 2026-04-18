import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getOrgContext } from "@/lib/api/get-org-context";
import { STATIC_PLAN_CONFIG } from "@/config/planConfig";
import { logger } from "@/lib/api/core/logger";
import type { PlanName, PlanConfig } from "@/types";

// ── Zod schema for Plan.features JSON ────────────────────────────────────────

const planFeatureFlagSchema = z.object({
    enabled: z.boolean(),
});

const planFeaturesSchema = z.object({
    scanning: z.object({
        multiScanner:      planFeatureFlagSchema,
        scanSchedule:      planFeatureFlagSchema,
    }),
    reporting: z.object({
        evidenceCapturing: planFeatureFlagSchema,
    }),
    ai: z.object({
        chat:              planFeatureFlagSchema,
    }),
    audit: z.object({
        export:            planFeatureFlagSchema,
    }),
});

// ── Zod schema for Plan.limits JSON ──────────────────────────────────────────

const planEntitlementsSchema = z.object({
    maxUsers:       z.number().nullable(),
    maxScansPerDay: z.number().nullable(),
    retentionDays:  z.number(),
    maxWorkers:     z.number(),
});

const planLimitsSchema = z.object({
    aiQueriesPerMonth: z.number().nullable(),
    exportFormats:     z.array(z.string()),
});

const planAccessRuleSchema = z.object({
    mode:    z.enum(["all", "limited"]),
    exclude: z.array(z.string()),
});

const planAccessSchema = z.object({
    scanners:     planAccessRuleSchema,
    integrations: planAccessRuleSchema,
});

const planLimitsWrapperSchema = z.object({
    entitlements: planEntitlementsSchema,
    limits:       planLimitsSchema,
    access:       planAccessSchema,
});

/**
 * GET /api/v1/plan/config
 *
 * Returns the full plan configuration for the authenticated org.
 * orgId is read from x-org-id header (injected by Axios interceptor).
 * Falls back to STATIC_PLAN_CONFIG if DB fails or data is malformed.
 *
 * @returns 200 { success: true, data: PlanConfig }
 * @returns 401 if not authenticated or no org context
 * @returns 500 (never — DB failures return static fallback instead)
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

    const { orgId } = ctx;

    // Query subscription + plan from DB
    try {
        const subscription = await prisma.subscription.findUnique({
            where:   { orgId },
            include: { plan: true },
        });

        // Default to Free if no subscription found
        const rawPlan = subscription?.plan;
        if (!rawPlan) {
            return NextResponse.json(
                {
                    success: true,
                    message: "Plan config loaded (default free)",
                    data:    STATIC_PLAN_CONFIG["free"] satisfies PlanConfig,
                },
                { status: 200 }
            );
        }

        // Validate Plan.name is a recognized PlanName
        const validPlanNames: PlanName[] = ["free", "pro", "growth"];
        const planName = (
            validPlanNames.includes(rawPlan.name as PlanName)
                ? rawPlan.name
                : "free"
        ) as PlanName;

        // Parse and validate Plan.features JSON
        const featuresResult = planFeaturesSchema.safeParse(rawPlan.features);
        if (!featuresResult.success) {
            logger.warn("[PLAN CONFIG] features JSON validation failed — using static fallback", {
                orgId,
                planId: rawPlan.id,
                errors: featuresResult.error.issues,
            });
            return buildStaticFallbackResponse(planName);
        }

        // Parse and validate Plan.limits JSON
        const limitsResult = planLimitsWrapperSchema.safeParse(rawPlan.limits);
        if (!limitsResult.success) {
            logger.warn("[PLAN CONFIG] limits JSON validation failed — using static fallback", {
                orgId,
                planId: rawPlan.id,
                errors: limitsResult.error.issues,
            });
            return buildStaticFallbackResponse(planName);
        }

        const planConfig: PlanConfig = {
            id:           rawPlan.id,
            name:         planName,
            displayName:  planName.charAt(0).toUpperCase() + planName.slice(1),
            tier:         planName === "free" ? 1 : planName === "pro" ? 2 : 3,
            features:     featuresResult.data,
            entitlements: limitsResult.data.entitlements,
            limits:       limitsResult.data.limits,
            access:       limitsResult.data.access,
        };

        return NextResponse.json(
            {
                success: true,
                message: "Plan config loaded",
                data:    planConfig,
            },
            { status: 200 }
        );

    } catch (error) {
        logger.error("[PLAN CONFIG] DB query failed — returning static fallback", {
            orgId,
            error,
        });

        return NextResponse.json(
            {
                success: true,
                message: "Plan config loaded (fallback)",
                data:    STATIC_PLAN_CONFIG["free"] satisfies PlanConfig,
            },
            { status: 200 }
        );
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildStaticFallbackResponse(planName: PlanName) {
    const fallback = STATIC_PLAN_CONFIG[planName] ?? STATIC_PLAN_CONFIG["free"];
    return NextResponse.json(
        {
            success: true,
            message: "Plan config loaded (static fallback)",
            data:    fallback satisfies PlanConfig,
        },
        { status: 200 }
    );
}
