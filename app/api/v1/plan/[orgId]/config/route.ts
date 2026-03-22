import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { verifyAccessToken } from "@/server/auth/jwt";
import { AUTH_CONSTANTS } from "@/config/auth.constants";
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

// ── Route params ──────────────────────────────────────────────────────────────

type RouteParams = { params: Promise<{ orgId: string }> };

/**
 * GET /api/v1/plan/:orgId/config
 *
 * Returns the full plan configuration for the authenticated org.
 * Reads from the DB subscription → plan record.
 * Falls back to STATIC_PLAN_CONFIG if DB fails or data is malformed.
 *
 * @returns 200 { success: true, data: PlanConfig }
 * @returns 401 if not authenticated or JWT is invalid
 * @returns 403 if orgId in URL does not match orgId in JWT
 * @returns 500 (never — DB failures return static fallback instead)
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
    // 1. Parse URL param
    const { orgId: urlOrgId } = await params;

    // 2. Verify access token
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

    const { orgId: jwtOrgId } = jwtPayload;

    // Must be org-scoped
    if (!jwtOrgId) {
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

    // 3. Validate URL orgId matches JWT orgId (prevents cross-org data access)
    if (urlOrgId !== jwtOrgId) {
        return NextResponse.json(
            {
                success: false,
                message: "Organisation mismatch",
                data:    null,
                error:   { code: "FORBIDDEN" },
            },
            { status: 403 }
        );
    }

    // 4. Query subscription + plan from DB
    try {
        const subscription = await prisma.subscription.findUnique({
            where:   { orgId: jwtOrgId },
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

        // 5. Validate Plan.name is a recognized PlanName
        const validPlanNames: PlanName[] = ["free", "pro", "growth"];
        const planName = (
            validPlanNames.includes(rawPlan.name as PlanName)
                ? rawPlan.name
                : "free"
        ) as PlanName;

        // 6. Parse and validate Plan.features JSON
        const featuresResult = planFeaturesSchema.safeParse(rawPlan.features);
        if (!featuresResult.success) {
            logger.warn("[PLAN CONFIG] features JSON validation failed — using static fallback", {
                orgId:  jwtOrgId,
                planId: rawPlan.id,
                errors: featuresResult.error.issues,
            });
            return buildStaticFallbackResponse(planName);
        }

        // 7. Parse and validate Plan.limits JSON
        const limitsResult = planLimitsWrapperSchema.safeParse(rawPlan.limits);
        if (!limitsResult.success) {
            logger.warn("[PLAN CONFIG] limits JSON validation failed — using static fallback", {
                orgId:  jwtOrgId,
                planId: rawPlan.id,
                errors: limitsResult.error.issues,
            });
            return buildStaticFallbackResponse(planName);
        }

        // 8. Build and return PlanConfig
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
        // DB failure — return static fallback instead of 500 so the UI never breaks
        logger.error("[PLAN CONFIG] DB query failed — returning static fallback", {
            orgId: jwtOrgId,
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
