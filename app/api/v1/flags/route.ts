import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getOrgContext } from "@/lib/api/get-org-context";
import { FEATURE_FLAG_KEYS } from "@/config/featureFlags";
import { logger } from "@/lib/api/core/logger";
import type { FeatureFlag } from "@/types";

// ── Zod validation schema ─────────────────────────────────────────────────────

const FLAG_KEY_TUPLE = Object.values(FEATURE_FLAG_KEYS) as [string, ...string[]];

const featureFlagSchema = z.object({
    id:             z.string(),
    key:            z.enum(FLAG_KEY_TUPLE),
    enabled:        z.boolean(),
    rolloutPercent: z.number().int().min(0).max(100),
});

/**
 * GET /api/v1/flags
 *
 * Returns all feature flags for the authenticated org.
 * orgId is read from x-org-id header (injected by Axios interceptor).
 * Unknown keys (stale DB records) are filtered out before the response.
 *
 * @returns 200 { success: true, data: { flags: FeatureFlag[] } }
 * @returns 401 if not authenticated or no org context
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

    try {
        const rawFlags = await prisma.featureFlag.findMany({
            where:  { orgId },
            select: {
                id:             true,
                key:            true,
                enabled:        true,
                rolloutPercent: true,
            },
        });

        // Validate each flag — filter out records with unknown / stale keys
        const validFlags: FeatureFlag[] = [];

        for (const flag of rawFlags) {
            const result = featureFlagSchema.safeParse(flag);
            if (result.success) {
                validFlags.push(result.data as FeatureFlag);
            } else {
                logger.warn("[FLAGS] Skipping flag with unknown or invalid data", {
                    orgId,
                    key:    flag.key,
                    errors: result.error.issues,
                });
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: "Feature flags loaded",
                data:    { flags: validFlags },
            },
            { status: 200 }
        );

    } catch (error) {
        logger.error("[FLAGS] DB query failed — returning empty flags array", {
            orgId,
            error,
        });

        return NextResponse.json(
            {
                success: true,
                message: "Feature flags loaded (empty — DB unavailable)",
                data:    { flags: [] },
            },
            { status: 200 }
        );
    }
}
