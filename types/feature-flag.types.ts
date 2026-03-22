// ============================================
// FEATURE FLAG TYPES — Phase 2C
// Rollout-control flags are per-org on/off switches in the DB.
// These are COMPLETELY SEPARATE from plan billing gating.
//
// Plan gating  → billing control ("Are you on the right plan?")
// Feature flag → rollout control ("Is this feature turned ON for your org?")
// ============================================

// ── Feature flag key union ────────────────────────────────────────────────────

/**
 * All valid feature flag keys.
 * Adding a new flag = add key here + add record to config/featureFlags.ts + seed DB.
 * Wrong key = compile-time error, not a runtime bug.
 */
export type FeatureFlagKey =
    | "new-dashboard"
    | "beta-scanner"
    | "ai-suggestions"
    | "advanced-reporting"
    | "bulk-actions";

// ── Single flag shape (from API / DB) ────────────────────────────────────────

/**
 * Single feature flag record as returned by GET /api/v1/flags/:orgId.
 * Matches the FeatureFlag Prisma model fields exactly.
 */
export interface FeatureFlag {
    id:             string;
    key:            FeatureFlagKey;
    enabled:        boolean;
    rolloutPercent: number; // 0–100
}

// ── Flags map (what the store holds) ─────────────────────────────────────────

/**
 * Map of all feature flags keyed by FeatureFlagKey.
 * The store holds Partial<FeatureFlagsMap> because not every flag may have
 * a DB record for the org — missing flag = disabled by default.
 */
export type FeatureFlagsMap = Record<FeatureFlagKey, FeatureFlag>;

// ── Hook return type ──────────────────────────────────────────────────────────

/**
 * Return shape from useFeatureFlag(key).
 * isLoaded: false while FlagsProvider is still fetching.
 */
export interface FeatureFlagResult {
    enabled:        boolean;
    rolloutPercent: number;
    isLoaded:       boolean;
}

// ── Zustand store types ───────────────────────────────────────────────────────

export interface FeatureFlagsState {
    /** Partial map — not all flags guaranteed to have DB records. */
    flags:      Partial<FeatureFlagsMap>;
    isLoaded:   boolean;
    isLoading:  boolean;
    /** True when API failed and STATIC_FEATURE_FLAGS is being used. */
    isFallback: boolean;
    error:      string | null;
}

export interface FeatureFlagsActions {
    /** Called on successful API response — applies rolloutPercent logic once. */
    setFeatureFlags:         (flags: FeatureFlag[]) => void;
    /** Called on API failure — sets STATIC_FEATURE_FLAGS (all disabled). */
    setFeatureFlagsFallback: () => void;
    setFeatureFlagsLoading:  (loading: boolean) => void;
    setFeatureFlagsError:    (error: string) => void;
    clearFeatureFlags:       () => void;
}

export type FeatureFlagsStore = FeatureFlagsState & FeatureFlagsActions;

// ── API response type ─────────────────────────────────────────────────────────

export interface GetFeatureFlagsResponse {
    flags: FeatureFlag[];
}
