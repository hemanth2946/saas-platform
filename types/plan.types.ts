// ============================================
// PLAN TYPES
// Plan gating hooks use these types.
// Actual entitlements always come from the server via /api/plan
// ============================================

export type Plan = "free" | "pro" | "growth" | "enterprise";

// Entitlements returned from server for current org's plan
export type PlanConfig = {
    plan: Plan;
    features: Record<string, boolean>;  // e.g. { "ai.assistant": true }
    limits: Record<string, number>;     // e.g. { "seats": 5 }
    quotas: Record<string, number>;     // e.g. { "ai.queries": 100 }
};

// What usePlanGate() returns
export type PlanGateResult = {
    allowed: boolean;
    limit?: number;       // current limit for this feature
    current?: number;     // current usage
    requiredPlan?: Plan;  // minimum plan needed
};

// Feature flag — separate from plan gating
// Flags = rollout control, Plans = billing control
export type FeatureFlag = {
    key: string;
    enabled: boolean;
    rolloutPercent?: number;
};