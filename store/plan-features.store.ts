/**
 * store/plan-features.store.ts
 *
 * Zustand store for plan features, entitlements, and limits.
 * SEPARATE from auth.store.ts — these two stores never subscribe to each other.
 *
 * Source of truth for plan gating in the UI.
 * Loaded by PlanProvider in app/[orgId]/layout.tsx.
 * Always fetched fresh — never persisted to localStorage.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
    PlanConfig,
    PlanFeaturesState,
    PlanFeaturesStore,
} from "@/types";

// ── Initial state ─────────────────────────────────────────────────────────────

const PLAN_FEATURES_INITIAL_STATE: PlanFeaturesState = {
    id:           null,
    name:         null,
    displayName:  null,
    tier:         null,
    features:     null,
    entitlements: null,
    limits:       null,
    access:       null,
    isLoaded:     false,
    isLoading:    false,
    isFallback:   false,
    error:        null,
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const usePlanFeaturesStore = create<PlanFeaturesStore>()(
    devtools(
        (set) => ({
            ...PLAN_FEATURES_INITIAL_STATE,

            setPlanFeatures: (config: PlanConfig) =>
                set(
                    { ...config, isLoaded: true, isLoading: false, isFallback: false, error: null },
                    false,
                    "planFeatures/setPlanFeatures"
                ),

            setPlanFeaturesFallback: (config: PlanConfig) =>
                set(
                    { ...config, isLoaded: true, isLoading: false, isFallback: true, error: null },
                    false,
                    "planFeatures/setPlanFeaturesFallback"
                ),

            setPlanFeaturesLoading: (loading: boolean) =>
                set({ isLoading: loading }, false, "planFeatures/setLoading"),

            setPlanFeaturesError: (error: string) =>
                set({ error, isLoading: false }, false, "planFeatures/setError"),

            clearPlanFeatures: () =>
                set(PLAN_FEATURES_INITIAL_STATE, false, "planFeatures/clear"),
        }),
        { name: "PlanFeaturesStore" }
    )
);

// ── Granular selectors ────────────────────────────────────────────────────────
// Components subscribe to only the slice they need — never the whole store.

export const usePlanName =         () => usePlanFeaturesStore((s) => s.name);
export const usePlanTier =         () => usePlanFeaturesStore((s) => s.tier);
export const usePlanIsLoaded =     () => usePlanFeaturesStore((s) => s.isLoaded);
export const usePlanIsLoading =    () => usePlanFeaturesStore((s) => s.isLoading);
export const usePlanIsFallback =   () => usePlanFeaturesStore((s) => s.isFallback);
export const usePlanFeatures =     () => usePlanFeaturesStore((s) => s.features);
export const usePlanEntitlements = () => usePlanFeaturesStore((s) => s.entitlements);
export const usePlanLimits =       () => usePlanFeaturesStore((s) => s.limits);
export const usePlanAccess =       () => usePlanFeaturesStore((s) => s.access);
export const usePlanError =        () => usePlanFeaturesStore((s) => s.error);

// ── Standalone clear helper ───────────────────────────────────────────────────
// Exported as a plain function so auth.store.ts can call it from clearOrgSession
// without importing the reactive store module (avoids circular store coupling).

export function clearPlanFeatures(): void {
    usePlanFeaturesStore.getState().clearPlanFeatures();
}
