/**
 * hooks/usePlanGate.ts
 *
 * Checks whether the current org's plan grants access to a gated feature.
 * Reads from plan-features.store.ts using granular selectors (no whole-store subscription).
 * Never throws — always returns a valid PlanGateResult.
 */

"use client";

import { getRequiredPlan } from "@/config/planConfig";
import {
    usePlanIsLoaded,
    usePlanFeatures,
    usePlanEntitlements,
    usePlanLimits,
} from "@/store/plan-features.store";
import type { FeaturePath, PlanGateResult } from "@/types";

// ── Safe fallback when plan is not loaded ────────────────────────────────────

const NOT_LOADED_RESULT: PlanGateResult = {
    allowed:      false,
    limit:        null,
    requiredPlan: null,
};

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns plan gate result for a given feature path.
 *
 * @example
 * const { allowed, requiredPlan } = usePlanGate("ai.chat")
 * const { allowed, limit } = usePlanGate("entitlements.maxUsers")
 */
export function usePlanGate(path: FeaturePath): PlanGateResult {
    const isLoaded     = usePlanIsLoaded();
    const features     = usePlanFeatures();
    const entitlements = usePlanEntitlements();
    const limits       = usePlanLimits();

    // Guard: plan not loaded yet
    if (!isLoaded || !features || !entitlements || !limits) {
        return NOT_LOADED_RESULT;
    }

    const [section, key] = path.split(".") as [string, string];

    // ── Boolean feature flags ────────────────────────────────────────────────

    if (section === "scanning") {
        const k = key as keyof typeof features.scanning;
        const feature = features.scanning[k];
        if (!feature) return NOT_LOADED_RESULT;
        const allowed = feature.enabled;
        return {
            allowed,
            limit:        null,
            requiredPlan: allowed ? null : getRequiredPlan(path),
        };
    }

    if (section === "reporting") {
        const k = key as keyof typeof features.reporting;
        const feature = features.reporting[k];
        if (!feature) return NOT_LOADED_RESULT;
        const allowed = feature.enabled;
        return {
            allowed,
            limit:        null,
            requiredPlan: allowed ? null : getRequiredPlan(path),
        };
    }

    if (section === "ai") {
        const k = key as keyof typeof features.ai;
        const feature = features.ai[k];
        if (!feature) return NOT_LOADED_RESULT;
        const allowed = feature.enabled;
        return {
            allowed,
            limit:        null,
            requiredPlan: allowed ? null : getRequiredPlan(path),
        };
    }

    if (section === "audit") {
        const k = key as keyof typeof features.audit;
        const feature = features.audit[k];
        if (!feature) return NOT_LOADED_RESULT;
        const allowed = feature.enabled;
        return {
            allowed,
            limit:        null,
            requiredPlan: allowed ? null : getRequiredPlan(path),
        };
    }

    // ── Numeric entitlements ──────────────────────────────────────────────────

    if (section === "entitlements") {
        const k = key as keyof typeof entitlements;
        const val = entitlements[k];
        if (val === undefined) return NOT_LOADED_RESULT;
        // null = unlimited = allowed; 0 = disabled; number > 0 = allowed
        const allowed = val !== 0;
        const limit   = typeof val === "number" ? val : null; // null stays null (unlimited)
        return {
            allowed,
            limit,
            requiredPlan: allowed ? null : getRequiredPlan(path),
        };
    }

    // ── Limits ────────────────────────────────────────────────────────────────

    if (section === "limits") {
        const k = key as keyof typeof limits;
        const val = limits[k];
        if (val === undefined) return NOT_LOADED_RESULT;

        if (Array.isArray(val)) {
            // exportFormats: allowed if array has items
            const allowed = val.length > 0;
            return {
                allowed,
                limit:        null,
                requiredPlan: allowed ? null : getRequiredPlan(path),
            };
        }

        // aiQueriesPerMonth: null = unlimited = allowed; 0 = disabled; > 0 = allowed
        const numVal  = val as number | null;
        const allowed = numVal !== 0;
        const limit   = numVal; // null stays null (unlimited)
        return {
            allowed,
            limit,
            requiredPlan: allowed ? null : getRequiredPlan(path),
        };
    }

    // Unknown path — safe fallback
    return NOT_LOADED_RESULT;
}
