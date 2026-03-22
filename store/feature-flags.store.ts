/**
 * store/feature-flags.store.ts
 *
 * Zustand store for per-org feature flags (rollout control).
 * SEPARATE from auth.store.ts and plan-features.store.ts.
 * The three stores never import each other directly.
 *
 * Source of truth for feature flag state in the UI.
 * Loaded by FlagsProvider in app/[orgId]/layout.tsx.
 * Flags are NEVER persisted to localStorage — always fetched fresh.
 *
 * rolloutPercent logic is resolved ONCE per session load (in buildFlagsMap).
 * This ensures consistent flag state within a session, not per render.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
    FeatureFlag,
    FeatureFlagKey,
    FeatureFlagsMap,
    FeatureFlagsState,
    FeatureFlagsStore,
} from "@/types";
import { STATIC_FEATURE_FLAGS } from "@/config/featureFlags";

// ── Initial state ─────────────────────────────────────────────────────────────

const FEATURE_FLAGS_INITIAL_STATE: FeatureFlagsState = {
    flags:      {},
    isLoaded:   false,
    isLoading:  false,
    isFallback: false,
    error:      null,
};

// ── rolloutPercent helper ─────────────────────────────────────────────────────

/**
 * Applies rolloutPercent logic to each flag and builds the store map.
 *
 * rolloutPercent rules (applied ONCE here — not on every render):
 *   0       → always disabled
 *   100     → enabled as-is from DB
 *   1–99    → random check: enabled if Math.random() < (rolloutPercent / 100)
 *
 * The random check happens once per org session load and is stored in state,
 * ensuring a consistent experience within a session.
 */
function buildFlagsMap(flags: FeatureFlag[]): Partial<FeatureFlagsMap> {
    const map: Partial<FeatureFlagsMap> = {};

    for (const flag of flags) {
        let resolvedEnabled: boolean;

        if (flag.rolloutPercent === 0) {
            // Always disabled regardless of the enabled field
            resolvedEnabled = false;
        } else if (flag.rolloutPercent === 100) {
            // Fully rolled out — use the enabled field as-is
            resolvedEnabled = flag.enabled;
        } else {
            // Partial rollout — random check applied once per session
            resolvedEnabled = flag.enabled && Math.random() < flag.rolloutPercent / 100;
        }

        map[flag.key as FeatureFlagKey] = {
            ...flag,
            enabled: resolvedEnabled,
        };
    }

    return map;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useFeatureFlagsStore = create<FeatureFlagsStore>()(
    devtools(
        (set) => ({
            ...FEATURE_FLAGS_INITIAL_STATE,

            setFeatureFlags: (flags: FeatureFlag[]) =>
                set(
                    {
                        flags:      buildFlagsMap(flags),
                        isLoaded:   true,
                        isLoading:  false,
                        isFallback: false,
                        error:      null,
                    },
                    false,
                    "featureFlags/setFeatureFlags"
                ),

            setFeatureFlagsFallback: () =>
                set(
                    {
                        flags:      STATIC_FEATURE_FLAGS,
                        isLoaded:   true,
                        isLoading:  false,
                        isFallback: true,
                        error:      null,
                    },
                    false,
                    "featureFlags/setFeatureFlagsFallback"
                ),

            setFeatureFlagsLoading: (loading: boolean) =>
                set({ isLoading: loading }, false, "featureFlags/setLoading"),

            setFeatureFlagsError: (error: string) =>
                set({ error, isLoading: false }, false, "featureFlags/setError"),

            clearFeatureFlags: () =>
                set(FEATURE_FLAGS_INITIAL_STATE, false, "featureFlags/clear"),
        }),
        { name: "FeatureFlagsStore" }
    )
);

// ── Granular selectors ────────────────────────────────────────────────────────
// Components subscribe only to the slice they need — never the whole store.

export const useAllFlags        = () => useFeatureFlagsStore((s) => s.flags);
export const useFlagsIsLoaded   = () => useFeatureFlagsStore((s) => s.isLoaded);
export const useFlagsIsLoading  = () => useFeatureFlagsStore((s) => s.isLoading);
export const useFlagsIsFallback = () => useFeatureFlagsStore((s) => s.isFallback);
export const useFlagsError      = () => useFeatureFlagsStore((s) => s.error);

// ── Standalone clear helper ───────────────────────────────────────────────────
// Exported as a plain function so auth.store.ts can call it from clearOrgSession
// without importing the reactive store module (avoids circular store coupling).

export function clearFeatureFlags(): void {
    useFeatureFlagsStore.getState().clearFeatureFlags();
}
