"use client";

import { useAuthStore } from "@/store/auth.store";
import type { Plan, PlanGateResult } from "@/types";

/** Ordered plan hierarchy — higher index = higher plan */
const PLAN_ORDER: Plan[] = ["free", "pro", "growth", "enterprise"];

/**
 * Returns true if `current` meets or exceeds `required`.
 * Always returns false rather than throwing if either value is unknown.
 */
function meetsMinimum(current: Plan | null, required: Plan): boolean {
    if (!current) return false;
    const currentIndex = PLAN_ORDER.indexOf(current);
    const requiredIndex = PLAN_ORDER.indexOf(required);
    if (currentIndex === -1 || requiredIndex === -1) return false;
    return currentIndex >= requiredIndex;
}

/**
 * Hook for checking if the current org's plan allows a feature.
 * Reads plan from Zustand — never throws, always degrades gracefully.
 *
 * If the store is not yet hydrated (plan === null), returns allowed: false
 * with no requiredPlan so the caller can show a skeleton instead of a lock.
 *
 * @param requiredPlan - Minimum plan needed to access the feature
 * @returns PlanGateResult — { allowed, requiredPlan }
 *
 * @example
 * const { allowed, requiredPlan } = usePlanGate("pro")
 * if (!allowed) return <UpgradePrompt requiredPlan={requiredPlan} />
 * return <ProFeature />
 */
export function usePlanGate(requiredPlan: Plan): PlanGateResult {
    const plan = useAuthStore((state) => state.plan);

    const allowed = meetsMinimum(plan, requiredPlan);

    return {
        allowed,
        requiredPlan: allowed ? undefined : requiredPlan,
    };
}
