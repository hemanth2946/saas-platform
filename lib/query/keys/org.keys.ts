/**
 * lib/query/keys/org.keys.ts
 *
 * TanStack Query key factory for the org domain.
 */

export const orgKeys = {
    /** Root key for all org-related queries. */
    all: (orgId: string) => ["org", orgId] as const,

    /** Key for a specific org's detail. */
    detail: (orgId: string) => [...orgKeys.all(orgId), "detail"] as const,
};
