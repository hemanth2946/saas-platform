/**
 * config/planConfig.ts
 *
 * Static fallback plan configurations.
 * Used when GET /api/v1/plan/:orgId/config fails.
 * Also used by getRequiredPlan() to determine minimum plan for a feature.
 *
 * IMPORTANT: These values must stay in sync with the plan values table
 * in the spec and with prisma/seed.ts.
 */

import type {
    PlanName,
    PlanConfig,
    PlanTier,
    FeaturePath,
    PlanFeatures,
    PlanEntitlements,
    PlanLimits,
} from "@/types";

// ── Display names ─────────────────────────────────────────────────────────────

export const PLAN_DISPLAY_NAMES: Record<PlanName, string> = {
    free:   "Free",
    pro:    "Pro",
    growth: "Growth",
} as const;

// ── Tier constants ─────────────────────────────────────────────────────────────

export const PLAN_TIER_MAP: Record<PlanName, PlanTier> = {
    free:   1,
    pro:    2,
    growth: 3,
} as const;

// ── Static plan configurations ────────────────────────────────────────────────

/**
 * Fallback plan configs used when the plan API is unavailable.
 * Values match the plan values table exactly.
 */
export const STATIC_PLAN_CONFIG: Record<PlanName, PlanConfig> = {
    free: {
        id:          "static-free",
        name:        "free",
        displayName: "Free",
        tier:        1,
        features: {
            scanning: {
                multiScanner:      { enabled: false },
                scanSchedule:      { enabled: false },
            },
            reporting: {
                evidenceCapturing: { enabled: false },
            },
            ai: {
                chat:              { enabled: false },
            },
            audit: {
                export:            { enabled: false },
            },
        },
        entitlements: {
            maxUsers:       2,
            maxScansPerDay: 5,
            retentionDays:  7,
            maxWorkers:     1,
        },
        limits: {
            aiQueriesPerMonth: 0,
            exportFormats:     ["csv"],
        },
        access: {
            scanners:     { mode: "limited", exclude: [] },
            integrations: { mode: "limited", exclude: [] },
        },
    },

    pro: {
        id:          "static-pro",
        name:        "pro",
        displayName: "Pro",
        tier:        2,
        features: {
            scanning: {
                multiScanner:      { enabled: true },
                scanSchedule:      { enabled: true },
            },
            reporting: {
                evidenceCapturing: { enabled: true },
            },
            ai: {
                chat:              { enabled: true },
            },
            audit: {
                export:            { enabled: true },
            },
        },
        entitlements: {
            maxUsers:       10,
            maxScansPerDay: 50,
            retentionDays:  30,
            maxWorkers:     5,
        },
        limits: {
            aiQueriesPerMonth: 100,
            exportFormats:     ["csv", "pdf"],
        },
        access: {
            scanners:     { mode: "all", exclude: [] },
            integrations: { mode: "all", exclude: [] },
        },
    },

    growth: {
        id:          "static-growth",
        name:        "growth",
        displayName: "Growth",
        tier:        3,
        features: {
            scanning: {
                multiScanner:      { enabled: true },
                scanSchedule:      { enabled: true },
            },
            reporting: {
                evidenceCapturing: { enabled: true },
            },
            ai: {
                chat:              { enabled: true },
            },
            audit: {
                export:            { enabled: true },
            },
        },
        entitlements: {
            maxUsers:       null,  // unlimited
            maxScansPerDay: null,  // unlimited
            retentionDays:  90,
            maxWorkers:     20,
        },
        limits: {
            aiQueriesPerMonth: null,  // unlimited
            exportFormats:     ["csv", "pdf", "json"],
        },
        access: {
            scanners:     { mode: "all", exclude: [] },
            integrations: { mode: "all", exclude: [] },
        },
    },
} as const satisfies Record<PlanName, PlanConfig>;

// ── Feature check helpers ──────────────────────────────────────────────────────

function isFeatureEnabled(config: PlanConfig, path: FeaturePath): boolean {
    const [section, key] = path.split(".") as [string, string];

    if (section === "scanning") {
        const k = key as keyof PlanFeatures["scanning"];
        return config.features.scanning[k]?.enabled ?? false;
    }
    if (section === "reporting") {
        const k = key as keyof PlanFeatures["reporting"];
        return config.features.reporting[k]?.enabled ?? false;
    }
    if (section === "ai") {
        const k = key as keyof PlanFeatures["ai"];
        return config.features.ai[k]?.enabled ?? false;
    }
    if (section === "audit") {
        const k = key as keyof PlanFeatures["audit"];
        return config.features.audit[k]?.enabled ?? false;
    }
    if (section === "entitlements") {
        const k = key as keyof PlanEntitlements;
        const val = config.entitlements[k];
        // null = unlimited = enabled; 0 = disabled; > 0 = enabled
        return val !== 0;
    }
    if (section === "limits") {
        const k = key as keyof PlanLimits;
        const val = config.limits[k];
        if (Array.isArray(val)) return val.length > 0;
        // null = unlimited = enabled; 0 = disabled
        return val !== 0;
    }

    return false;
}

/**
 * Given a FeaturePath, returns the minimum plan name that enables it.
 *
 * Logic: iterate plans in tier order (free → pro → growth).
 * The first plan where the feature is enabled/non-zero is the required plan.
 * If free already enables it, returns null (no tag shown — feature is baseline).
 * Returns null if no plan enables it (edge case — no upgrade CTA makes sense).
 */
export function getRequiredPlan(path: FeaturePath): PlanName | null {
    const orderedPlans: PlanName[] = ["free", "pro", "growth"];

    for (const planName of orderedPlans) {
        if (isFeatureEnabled(STATIC_PLAN_CONFIG[planName], path)) {
            // Free already enables it → no upgrade needed → no tag
            if (planName === "free") return null;
            return planName;
        }
    }

    // No plan enables this feature — no upgrade CTA
    return null;
}
