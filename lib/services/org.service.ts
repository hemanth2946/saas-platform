/**
 * lib/services/org.service.ts
 *
 * Business logic for org management.
 * Calls org.api.ts and keeps the Zustand auth store in sync.
 */

import { orgApi } from "@/lib/api/resources/org.api";
import { useAuthStore } from "@/store/auth.store";
import type { OrgContext, OrgSettings } from "@/types/org.types";

/**
 * Fetches org details by ID.
 */
export async function getOrgService(orgId: string): Promise<OrgContext> {
    const response = await orgApi.getOrg(orgId);
    return response.data;
}

/**
 * Updates org settings and syncs the new state to the auth store.
 */
export async function updateOrgService(
    orgId: string,
    data: OrgSettings
): Promise<OrgContext> {
    const response = await orgApi.updateOrgSettings(orgId, data);
    useAuthStore.getState().updateOrg(response.data);
    return response.data;
}

/**
 * Deletes the org, clears auth state, and redirects to /login.
 */
export async function deleteOrgService(orgId: string): Promise<void> {
    await orgApi.deleteOrg(orgId);
    useAuthStore.getState().clearAuth();
    if (typeof window !== "undefined") {
        window.location.href = "/login";
    }
}
