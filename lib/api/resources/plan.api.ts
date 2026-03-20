/**
 * lib/api/resources/plan.api.ts
 *
 * Raw HTTP functions for the plan/entitlements domain.
 * Business logic lives in lib/services/plan.service.ts.
 */

import { internalClient } from "@/lib/api/clients/internal.client";
import { ENDPOINTS } from "@/lib/api/constants/endpoints";
import type { ApiResponse } from "@/types/api.types";
import type { PlanConfig } from "@/types/plan.types";

export type UsageData = {
    seats: { used: number; limit: number };
    queries: { used: number; limit: number };
};

export const planApi = {
    /**
     * Returns the org's current plan configuration and feature flags.
     */
    getPlanConfig(orgId: string): Promise<ApiResponse<PlanConfig>> {
        return internalClient
            .get<ApiResponse<PlanConfig>>(ENDPOINTS.PLAN.config(orgId))
            .then((r) => r.data);
    },

    /**
     * Returns the org's current usage against plan limits.
     */
    getUsage(orgId: string): Promise<ApiResponse<UsageData>> {
        return internalClient
            .get<ApiResponse<UsageData>>(ENDPOINTS.PLAN.usage(orgId))
            .then((r) => r.data);
    },
};
