/**
 * lib/api/resources/org.api.ts
 *
 * Raw HTTP functions for the org domain.
 * Business logic lives in lib/services/org.service.ts.
 */

import { internalClient } from "@/lib/api/clients/internal.client";
import { ENDPOINTS } from "@/lib/api/constants/endpoints";
import type { ApiResponse } from "@/types/api.types";
import type { OrgContext, OrgSettings } from "@/types/org.types";

export const orgApi = {
    /**
     * Fetches org details by ID.
     */
    getOrg(orgId: string): Promise<ApiResponse<OrgContext>> {
        return internalClient
            .get<ApiResponse<OrgContext>>(ENDPOINTS.ORG.getOrg(orgId))
            .then((r) => r.data);
    },

    /**
     * Updates org settings and returns the updated org context.
     */
    updateOrgSettings(
        orgId: string,
        data: OrgSettings
    ): Promise<ApiResponse<OrgContext>> {
        return internalClient
            .patch<ApiResponse<OrgContext>>(ENDPOINTS.ORG.updateOrg(orgId), data)
            .then((r) => r.data);
    },

    /**
     * Permanently deletes the org and all associated data.
     */
    deleteOrg(orgId: string): Promise<ApiResponse<null>> {
        return internalClient
            .delete<ApiResponse<null>>(ENDPOINTS.ORG.deleteOrg(orgId))
            .then((r) => r.data);
    },
};
