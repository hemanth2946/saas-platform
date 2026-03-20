/**
 * lib/query/keys/plan.keys.ts
 *
 * TanStack Query key factory for the plan/entitlements domain.
 */

export const planKeys = {
    /** Key for the org's plan configuration. */
    config: (orgId: string) => ["plan", orgId, "config"] as const,

    /** Key for the org's current usage data. */
    usage: (orgId: string) => ["plan", orgId, "usage"] as const,
};
