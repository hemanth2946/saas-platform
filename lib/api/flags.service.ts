/**
 * lib/api/flags.service.ts
 *
 * Feature flags service for Phase 2C.
 * Fetches the org's feature flags from GET /api/v1/flags/:orgId.
 *
 * Error handling is performed by the Axios response interceptor.
 * Do not add duplicate try/catch here — let errors propagate to TanStack Query.
 */

import { internalClient } from "@/lib/api/clients/internal.client";
import { ENDPOINTS } from "@/lib/api/constants/endpoints";
import type { ApiResponse, FeatureFlag, GetFeatureFlagsResponse } from "@/types";

/**
 * Fetches all feature flags for the given org.
 * Returns the unwrapped flags array for direct use by the feature flags store.
 *
 * Returns an empty array if the API response has no flags field (defensive guard).
 *
 * @throws Will re-throw Axios errors — handled by TanStack Query error state.
 */
export async function getFeatureFlags(orgId: string): Promise<FeatureFlag[]> {
    const response = await internalClient.get<ApiResponse<GetFeatureFlagsResponse>>(
        ENDPOINTS.FLAGS.list(orgId)
    );
    return response.data.data?.flags ?? [];
}
