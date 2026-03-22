/**
 * hooks/useFeatureFlag.ts
 *
 * Reads a single feature flag from the flags store.
 * Never throws — always returns a valid FeatureFlagResult.
 * Zero async — pure synchronous store read.
 *
 * The rolloutPercent random check was already resolved once by the store's
 * buildFlagsMap helper. This hook is a simple, safe read.
 */

"use client";

import { useAllFlags, useFlagsIsLoaded } from "@/store/feature-flags.store";
import type { FeatureFlagKey, FeatureFlagResult } from "@/types";

// ── Safe fallback when flags are not yet loaded ───────────────────────────────

const NOT_LOADED_RESULT: FeatureFlagResult = {
    enabled:        false,
    rolloutPercent: 0,
    isLoaded:       false,
};

const MISSING_FLAG_RESULT: FeatureFlagResult = {
    enabled:        false,
    rolloutPercent: 0,
    isLoaded:       true,
};

// ── Single-flag hook ──────────────────────────────────────────────────────────

/**
 * Returns the resolved state for a single feature flag.
 *
 * @param key - A valid FeatureFlagKey (wrong key = TypeScript error)
 * @returns FeatureFlagResult — always safe, never throws
 *
 * @example
 * const { enabled } = useFeatureFlag(FEATURE_FLAG_KEYS.BETA_SCANNER)
 * if (enabled) { return <BetaScannerBanner /> }
 */
export function useFeatureFlag(key: FeatureFlagKey): FeatureFlagResult {
    const isLoaded = useFlagsIsLoaded();
    const flags    = useAllFlags();

    // Guard: provider has not finished loading yet
    if (!isLoaded) {
        return NOT_LOADED_RESULT;
    }

    const flag = flags[key];

    // Guard: no DB record for this key — disabled by default (safe fallback)
    if (!flag) {
        return MISSING_FLAG_RESULT;
    }

    return {
        enabled:        flag.enabled,
        rolloutPercent: flag.rolloutPercent,
        isLoaded:       true,
    };
}

// ── Multi-flag hook ───────────────────────────────────────────────────────────

/**
 * Returns resolved state for multiple feature flags at once.
 * Use this when a component needs several flags — avoids multiple hook calls.
 *
 * @param keys - Array of valid FeatureFlagKeys
 * @returns Record mapping each key to its FeatureFlagResult
 *
 * @example
 * const results = useFeatureFlags([
 *   FEATURE_FLAG_KEYS.BETA_SCANNER,
 *   FEATURE_FLAG_KEYS.BULK_ACTIONS,
 * ])
 * if (results["beta-scanner"].enabled && results["bulk-actions"].enabled) { ... }
 */
export function useFeatureFlags(
    keys: FeatureFlagKey[]
): Record<FeatureFlagKey, FeatureFlagResult> {
    const isLoaded = useFlagsIsLoaded();
    const flags    = useAllFlags();

    return keys.reduce<Record<FeatureFlagKey, FeatureFlagResult>>(
        (acc, key) => {
            if (!isLoaded) {
                acc[key] = NOT_LOADED_RESULT;
                return acc;
            }

            const flag = flags[key];
            if (!flag) {
                acc[key] = MISSING_FLAG_RESULT;
                return acc;
            }

            acc[key] = {
                enabled:        flag.enabled,
                rolloutPercent: flag.rolloutPercent,
                isLoaded:       true,
            };

            return acc;
        },
        {} as Record<FeatureFlagKey, FeatureFlagResult>
    );
}
