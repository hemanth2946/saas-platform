/**
 * lib/api/plan.service.ts
 *
 * Plan config service for Phase 2D.
 * Fetches the rich PlanConfig from GET /api/v1/plan/config.
 * orgId travels via x-org-id header (injected by Axios interceptor).
 *
 * Error handling is performed by the Axios response interceptor.
 * Do not add duplicate try/catch here — let errors propagate to TanStack Query.
 */

import { internalClient } from "@/lib/api/clients/internal.client";
import { ENDPOINTS } from "@/lib/api/constants/endpoints";
import type { ApiResponse, PlanConfig } from "@/types";

/**
 * Fetches the full plan configuration for the current org.
 * orgId is injected automatically via x-org-id header.
 * Returns the unwrapped PlanConfig for direct use by the plan features store.
 *
 * @throws Will re-throw Axios errors — handled by TanStack Query error state.
 */
export async function getPlanConfig(): Promise<PlanConfig> {
    const response = await internalClient.get<ApiResponse<PlanConfig>>(
        ENDPOINTS.PLAN.config
    );
    return response.data.data;
}
