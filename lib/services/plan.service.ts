/**
 * lib/services/plan.service.ts
 *
 * Business logic for plan entitlements.
 * Calls plan.api.ts and syncs plan state to the Zustand auth store.
 */

import { planApi } from "@/lib/api/resources/plan.api";
import type { UsageData } from "@/lib/api/resources/plan.api";
import { useAuthStore } from "@/store/auth.store";
import type { PlanConfig } from "@/types/plan.types";

/**
 * Fetches the org's plan configuration and updates the store.
 */
export async function getPlanConfigService(orgId: string): Promise<PlanConfig> {
    const response = await planApi.getPlanConfig(orgId);
    useAuthStore.getState().setPlan(response.data);
    return response.data;
}

/**
 * Returns the org's current usage against plan limits.
 */
export async function getUsageService(orgId: string): Promise<UsageData> {
    const response = await planApi.getUsage(orgId);
    return response.data;
}
