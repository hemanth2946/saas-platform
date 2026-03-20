/**
 * lib/api/constants/endpoints.ts
 *
 * All API endpoint paths with /api/v1/ version prefix.
 * Use these constants everywhere — never hardcode endpoint strings.
 */

const V1 = "/api/v1";

export const ENDPOINTS = {
    AUTH: {
        login: `${V1}/auth/login`,
        signup: `${V1}/auth/signup`,
        logout: `${V1}/auth/logout`,
        refresh: `${V1}/auth/refresh`,
        verifyEmail: `${V1}/auth/verify-email`,
        me: `${V1}/auth/me`,
    },

    ORG: {
        getOrg: (orgId: string): string => `${V1}/orgs/${orgId}`,
        updateOrg: (orgId: string): string => `${V1}/orgs/${orgId}`,
        deleteOrg: (orgId: string): string => `${V1}/orgs/${orgId}`,
    },

    USERS: {
        list: (orgId: string): string => `${V1}/orgs/${orgId}/users`,
        invite: (orgId: string): string => `${V1}/orgs/${orgId}/users/invite`,
        remove: (orgId: string, userId: string): string =>
            `${V1}/orgs/${orgId}/users/${userId}`,
        updateRole: (orgId: string, userId: string): string =>
            `${V1}/orgs/${orgId}/users/${userId}/role`,
        suspend: (orgId: string, userId: string): string =>
            `${V1}/orgs/${orgId}/users/${userId}/suspend`,
    },

    PLAN: {
        config: (orgId: string): string => `${V1}/orgs/${orgId}/plan`,
        usage: (orgId: string): string => `${V1}/orgs/${orgId}/plan/usage`,
    },

    HEALTH: {
        ping: "/api/health",
    },
} as const;
