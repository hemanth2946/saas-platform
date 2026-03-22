/**
 * config/featureFlags.ts
 *
 * Source of truth for all feature flag keys and static fallback.
 * Adding a new flag requires:
 *   1. Add key to FeatureFlagKey union in types/feature-flag.types.ts
 *   2. Add constant here
 *   3. Add description here
 *   4. Add DB seed record in prisma/seed.ts
 */

import type { FeatureFlagKey, FeatureFlagsMap } from "@/types";

// ── Flag key constants ────────────────────────────────────────────────────────

/**
 * All valid feature flag key constants.
 * Use these instead of raw string literals to avoid typos.
 *
 * @example
 * const { enabled } = useFeatureFlag(FEATURE_FLAG_KEYS.BETA_SCANNER)
 */
export const FEATURE_FLAG_KEYS = {
    NEW_DASHBOARD:      "new-dashboard",
    BETA_SCANNER:       "beta-scanner",
    AI_SUGGESTIONS:     "ai-suggestions",
    ADVANCED_REPORTING: "advanced-reporting",
    BULK_ACTIONS:       "bulk-actions",
} as const satisfies Record<string, FeatureFlagKey>;

// ── Static fallback ───────────────────────────────────────────────────────────

/**
 * Static fallback used when GET /api/v1/flags/:orgId fails.
 * Empty object = all flags disabled = safe default.
 *
 * Consequence: when API fails, all feature-flagged UI is hidden.
 * This is intentional — disabled flags hide unreleased features safely.
 * Users on working plans still get their plan features; only
 * rollout-controlled features are hidden until connectivity is restored.
 */
export const STATIC_FEATURE_FLAGS: Partial<FeatureFlagsMap> = {};

// ── Human-readable descriptions ───────────────────────────────────────────────

/**
 * Human-readable label for each flag key.
 * Used by the DEV fallback indicator and future admin UI.
 */
export const FEATURE_FLAG_DESCRIPTIONS: Record<FeatureFlagKey, string> = {
    "new-dashboard":      "New dashboard UI redesign",
    "beta-scanner":       "Experimental scanner with advanced detection",
    "ai-suggestions":     "AI-powered suggestions panel",
    "advanced-reporting": "New reporting module with custom exports",
    "bulk-actions":       "Bulk action controls in data tables",
} as const;
