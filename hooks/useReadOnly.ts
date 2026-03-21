"use client";

import { useAuthStore } from "@/store/auth.store";

/**
 * Returns true if the org's subscription has expired.
 *
 * Logic:
 * - Reads plan from Zustand auth store
 * - Checks subscription currentPeriodEnd against Date.now()
 * - Returns false if plan data is not yet loaded (default to allowing access)
 * - This is about subscription expiry — NOT about permission/role checks
 *
 * @returns true if subscription has expired (read-only mode should be enforced)
 *
 * @example
 * const isReadOnly = useReadOnly()
 * if (isReadOnly) return <DisabledState />
 */
export function useReadOnly(): boolean {
    const org = useAuthStore((state) => state.org);

    if (!org) return false;

    // OrgContext.plan is the plan name string.
    // currentPeriodEnd lives on the subscription, which is not directly
    // in OrgContext. We expose it via the extended org context if available.
    // Cast to check for optional field added by select-org enrichment.
    const extended = org as typeof org & { currentPeriodEnd?: string | null };

    if (!extended.currentPeriodEnd) {
        // No expiry date means the subscription is perpetual / trial without end
        return false;
    }

    const periodEnd = new Date(extended.currentPeriodEnd).getTime();
    return periodEnd < Date.now();
}
