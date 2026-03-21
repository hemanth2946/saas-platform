/**
 * lib/query/keys/auth.keys.ts
 *
 * TanStack Query key factory for the auth domain.
 */

export const authKeys = {
    /** Key for the current session state. */
    session: () => ["auth", "session"] as const,

    /** Key for the /auth/me endpoint. */
    me: () => ["auth", "me"] as const,

    /**
     * Key for the permissions fetch in [orgId]/layout.tsx.
     * Scoped by orgId so switching orgs forces a fresh fetch.
     */
    permissions: (orgId: string) => ["auth", "permissions", orgId] as const,
};
