/**
 * lib/services/plan.service.ts
 *
 * Business logic for plan entitlements.
 * In Phase 2B+, full plan config is managed by PlanProvider + plan-features.store.ts.
 * This service remains for usage data access.
 */

import { planApi } from "@/lib/api/resources/plan.api";
import type { UsageData } from "@/lib/api/resources/plan.api";

/**
 * Returns the org's current usage against plan limits.
 */
export async function getUsageService(orgId: string): Promise<UsageData> {
    const response = await planApi.getUsage(orgId);
    return response.data;
}
