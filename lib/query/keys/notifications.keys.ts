/**
 * lib/query/keys/notifications.keys.ts
 *
 * TanStack Query key factory for the notifications domain.
 */

export const notificationKeys = {
    /** Root key for all notification queries in an org. */
    all: (orgId: string) => ["notifications", orgId] as const,

    /** Key for the unread notification count / list. */
    unread: (orgId: string) =>
        [...notificationKeys.all(orgId), "unread"] as const,
};
