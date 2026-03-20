/**
 * lib/query/keys/featureFlags.keys.ts
 *
 * TanStack Query key factory for the feature flags domain.
 */

export const featureFlagKeys = {
    /** Root key for all feature flag queries in an org. */
    all: (orgId: string) => ["featureFlags", orgId] as const,

    /** Key for a specific feature flag by its string key. */
    byKey: (orgId: string, key: string) =>
        [...featureFlagKeys.all(orgId), key] as const,
};
