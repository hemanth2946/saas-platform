// ============================================
// TYPES — central export
// Import everything from "@/types" — never from individual files
// e.g. import type { Permission, ApiResponse, SessionUser } from "@/types"
// ============================================

export type { Permission, UserRole } from "./permission.types";

export type {
    // Plan name unions
    Plan,
    PlanName,
    PlanTier,
    // Feature shapes
    PlanFeatureFlag,
    PlanFeatures,
    PlanEntitlements,
    PlanLimits,
    PlanAccessRule,
    PlanAccess,
    // Config shapes
    PlanConfig,
    OrgPlanSummary,
    // Plan gating
    FeaturePath,
    PlanGateResult,
    PlanTagVariant,
    // Store types
    PlanFeaturesState,
    PlanFeaturesActions,
    PlanFeaturesStore,
} from "./plan.types";

export type {
    // Feature flag key union
    FeatureFlagKey,
    // Feature flag shapes
    FeatureFlag,
    FeatureFlagsMap,
    // Hook return type
    FeatureFlagResult,
    // Store types
    FeatureFlagsState,
    FeatureFlagsActions,
    FeatureFlagsStore,
    // API response
    GetFeatureFlagsResponse,
} from "./feature-flag.types";

// PLAN_TIERS is a const, not a type — must be exported separately (not with export type)
export { PLAN_TIERS } from "./plan.types";

export type { OrgContext, OrgSettings } from "./org.types";

export type {
    ApiResponse,
    ApiErrorResponse,
    ApiResult,
    ApiErrorCode,
    PaginatedResponse,
} from "./api.types";

export type { SessionUser, AuthTokens, AuthState } from "./auth.types";
export type { OrgSummary } from "./org-summary.types";
