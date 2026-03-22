// ============================================
// PLAN TYPES — Phase 2B
// Plan gating uses PlanConfig, PlanFeatures, etc.
// OrgPlanSummary = simple shape from select-org (stored in auth store)
// PlanConfig     = rich shape from /api/v1/plan/:orgId/config (plan features store)
// ============================================

// ── Plan name unions ─────────────────────────────────────────────────────────

/** Full union including enterprise — used by OrgContext.plan for backward compat */
export type Plan = "free" | "pro" | "growth" | "enterprise";

/**
 * 3-plan gating union — enterprise excluded per DECISION 1.
 * All plan comparisons use PLAN_TIERS numbers, never string comparisons.
 */
export type PlanName = "free" | "pro" | "growth";

// ── Tier system ───────────────────────────────────────────────────────────────

export const PLAN_TIERS = {
    free:   1,
    pro:    2,
    growth: 3,
} as const satisfies Record<PlanName, number>;

export type PlanTier = (typeof PLAN_TIERS)[PlanName]; // 1 | 2 | 3

// ── Feature flags ─────────────────────────────────────────────────────────────

export interface PlanFeatureFlag {
    enabled: boolean;
}

export interface PlanFeatures {
    scanning: {
        multiScanner:      PlanFeatureFlag;
        scanSchedule:      PlanFeatureFlag;
    };
    reporting: {
        evidenceCapturing: PlanFeatureFlag;
    };
    ai: {
        chat:              PlanFeatureFlag;
    };
    audit: {
        export:            PlanFeatureFlag;
    };
}

// ── Entitlements, limits, access ─────────────────────────────────────────────

export interface PlanEntitlements {
    maxUsers:       number | null; // null = unlimited
    maxScansPerDay: number | null; // null = unlimited
    retentionDays:  number;
    maxWorkers:     number;
}

export interface PlanLimits {
    aiQueriesPerMonth: number | null; // null = unlimited
    exportFormats:     string[];
}

export interface PlanAccessRule {
    mode:    "all" | "limited";
    exclude: string[];
}

export interface PlanAccess {
    scanners:     PlanAccessRule;
    integrations: PlanAccessRule;
}

// ── Full plan config (rich shape — API response + plan features store) ─────────

/**
 * Full plan configuration returned by GET /api/v1/plan/:orgId/config.
 * Stored exclusively in plan-features.store.ts.
 */
export interface PlanConfig {
    id:           string;
    name:         PlanName;
    displayName:  string;
    tier:         PlanTier;
    features:     PlanFeatures;
    entitlements: PlanEntitlements;
    limits:       PlanLimits;
    access:       PlanAccess;
}

// ── Simple plan summary (from select-org, stored in auth store) ───────────────

/**
 * Lightweight plan summary returned by POST /api/auth/select-org.
 * Stored in auth.store.ts as a quick reference only.
 * Full rich config is always fetched fresh by PlanProvider.
 */
export type OrgPlanSummary = {
    plan:     Plan;
    features: Record<string, boolean>;
    limits:   Record<string, number>;
    quotas:   Record<string, number>;
};

// ── Feature path type ─────────────────────────────────────────────────────────

/**
 * Dot-notation paths into the plan state for usePlanGate().
 * Wrong path = compile-time error.
 */
export type FeaturePath =
    | "scanning.multiScanner"
    | "scanning.scanSchedule"
    | "reporting.evidenceCapturing"
    | "ai.chat"
    | "audit.export"
    | "entitlements.maxUsers"
    | "entitlements.maxScansPerDay"
    | "entitlements.retentionDays"
    | "entitlements.maxWorkers"
    | "limits.aiQueriesPerMonth"
    | "limits.exportFormats";

// ── Plan gate result ──────────────────────────────────────────────────────────

export interface PlanGateResult {
    allowed:      boolean;
    limit:        number | null;   // populated for numeric entitlements; null for boolean features
    requiredPlan: PlanName | null; // null if already allowed on the current plan
}

// ── Plan tag variant ──────────────────────────────────────────────────────────

/** Free has no tag — it is the baseline. Tags only appear on Pro and Growth. */
export type PlanTagVariant = "pro" | "growth";

// ── Zustand store types ───────────────────────────────────────────────────────

/**
 * Plan features store state.
 * All PlanConfig fields are nullable until the API responds successfully.
 */
export interface PlanFeaturesState {
    id:           string | null;
    name:         PlanName | null;
    displayName:  string | null;
    tier:         PlanTier | null;
    features:     PlanFeatures | null;
    entitlements: PlanEntitlements | null;
    limits:       PlanLimits | null;
    access:       PlanAccess | null;
    isLoaded:     boolean;
    isLoading:    boolean;
    isFallback:   boolean;
    error:        string | null;
}

export interface PlanFeaturesActions {
    setPlanFeatures:         (config: PlanConfig) => void;
    setPlanFeaturesFallback: (config: PlanConfig) => void;
    setPlanFeaturesLoading:  (loading: boolean) => void;
    setPlanFeaturesError:    (error: string) => void;
    clearPlanFeatures:       () => void;
}

export type PlanFeaturesStore = PlanFeaturesState & PlanFeaturesActions;

// ── Feature flag (rollout control — separate from plan billing gating) ─────────

/** Feature flag for rollout control. Separate from plan billing gating. */
export type FeatureFlag = {
    key:             string;
    enabled:         boolean;
    rolloutPercent?: number;
};
