import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { verifyAccessToken } from "@/server/auth/jwt";
import { AUTH_CONSTANTS } from "@/config/auth.constants";
import { FEATURE_FLAG_KEYS } from "@/config/featureFlags";
import { logger } from "@/lib/api/core/logger";
import type { FeatureFlag } from "@/types";

// ── Zod validation schema ─────────────────────────────────────────────────────
// All valid flag key values as a const tuple for z.enum.
// New keys must be added to FEATURE_FLAG_KEYS in config/featureFlags.ts —
// they will automatically be included here.

const FLAG_KEY_TUPLE = Object.values(FEATURE_FLAG_KEYS) as [string, ...string[]];

const featureFlagSchema = z.object({
    id:             z.string(),
    key:            z.enum(FLAG_KEY_TUPLE),
    enabled:        z.boolean(),
    rolloutPercent: z.number().int().min(0).max(100),
});

// ── Route params ──────────────────────────────────────────────────────────────

type RouteParams = { params: Promise<{ orgId: string }> };

/**
 * GET /api/v1/flags/:orgId
 *
 * Returns all feature flags for the authenticated org.
 * Unknown keys (stale DB records) are filtered out before the response.
 * DB failures return an empty flags array — client uses static fallback.
 *
 * @returns 200 { success: true, data: { flags: FeatureFlag[] } }
 * @returns 401 if not authenticated or JWT is invalid / missing org scope
 * @returns 403 if orgId in URL does not match orgId in JWT
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
    // 1. Read URL param
    const { orgId: urlOrgId } = await params;

    // 2. Verify access token from httpOnly cookie
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

    // Must be an org-scoped JWT (select-org must have been called)
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

    // 3. Validate URL orgId matches JWT orgId — prevents cross-org data access
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

    // 4. Query feature flags from DB
    try {
        const rawFlags = await prisma.featureFlag.findMany({
            where:  { orgId: jwtOrgId },
            select: {
                id:             true,
                key:            true,
                enabled:        true,
                rolloutPercent: true,
            },
        });

        // 5. Validate each flag — filter out records with unknown / stale keys
        const validFlags: FeatureFlag[] = [];

        for (const flag of rawFlags) {
            const result = featureFlagSchema.safeParse(flag);
            if (result.success) {
                validFlags.push(result.data as FeatureFlag);
            } else {
                // Log but do not error — stale keys happen after code rollbacks
                logger.warn("[FLAGS] Skipping flag with unknown or invalid data", {
                    orgId:  jwtOrgId,
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
        // DB failure — return empty flags array so the client uses static fallback.
        // This keeps the UI functional (all flagged features disabled, not crashed).
        logger.error("[FLAGS] DB query failed — returning empty flags array", {
            orgId: jwtOrgId,
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
