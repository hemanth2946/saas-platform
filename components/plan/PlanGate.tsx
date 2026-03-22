"use client";

import { usePlanGate } from "@/hooks/usePlanGate";
import type { FeaturePath } from "@/types";

// ============================================
// TYPES
// ============================================

interface PlanGateProps {
    /** Dot-notation feature path — wrong path is a compile error */
    feature:   FeaturePath;
    /** Rendered when the plan does not grant access. Defaults to null. */
    fallback?: React.ReactNode;
    children:  React.ReactNode;
}

// ============================================
// <PlanGate>
// ============================================

/**
 * Renders children only if the current org's plan grants access to `feature`.
 * Renders fallback (or null) when the plan does not include the feature.
 *
 * Different from <Guard>:
 * - <Guard> hides items when the user has no RBAC permission
 * - <PlanGate> shows a fallback/upgrade prompt when the plan doesn't include the feature
 *
 * @example
 * <PlanGate feature="ai.chat" fallback={<UpgradePrompt requiredPlan="pro" />}>
 *   <AIChatButton />
 * </PlanGate>
 */
export function PlanGate({ feature, fallback = null, children }: PlanGateProps) {
    const { allowed } = usePlanGate(feature);

    if (allowed) return <>{children}</>;
    return <>{fallback}</>;
}
