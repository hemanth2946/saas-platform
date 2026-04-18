/**
 * lib/api/flags.service.ts
 *
 * Feature flags service for Phase 2D.
 * Fetches the org's feature flags from GET /api/v1/flags.
 * orgId travels via x-org-id header (injected by Axios interceptor).
 *
 * Error handling is performed by the Axios response interceptor.
 * Do not add duplicate try/catch here — let errors propagate to TanStack Query.
 */

import { internalClient } from "@/lib/api/clients/internal.client";
import { ENDPOINTS } from "@/lib/api/constants/endpoints";
import type { ApiResponse, FeatureFlag, GetFeatureFlagsResponse } from "@/types";

/**
 * Fetches all feature flags for the current org.
 * orgId is injected automatically via x-org-id header.
 * Returns the unwrapped flags array for direct use by the feature flags store.
 *
 * Returns an empty array if the API response has no flags field (defensive guard).
 *
 * @throws Will re-throw Axios errors — handled by TanStack Query error state.
 */
export async function getFeatureFlags(): Promise<FeatureFlag[]> {
    const response = await internalClient.get<ApiResponse<GetFeatureFlagsResponse>>(
        ENDPOINTS.FLAGS.list
    );
    return response.data.data?.flags ?? [];
}
