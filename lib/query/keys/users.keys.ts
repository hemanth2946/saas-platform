/**
 * lib/query/keys/users.keys.ts
 *
 * TanStack Query key factory for the users domain.
 */

export const usersKeys = {
    /** Root key for all user queries in an org. */
    all: (orgId: string) => ["users", orgId] as const,

    /** Key for the user list within an org. */
    list: (orgId: string) => [...usersKeys.all(orgId), "list"] as const,

    /** Key for a specific user's detail. */
    detail: (orgId: string, userId: string) =>
        [...usersKeys.all(orgId), "detail", userId] as const,
};
