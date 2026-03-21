/**
 * lib/api/constants/endpoints.ts
 *
 * All API endpoint paths with /api/v1/ version prefix.
 * Use these constants everywhere — never hardcode endpoint strings.
 */

const V1 = "/api/v1";

export const ENDPOINTS = {
    AUTH: {
        login: `/api/auth/login`,
        signup: `/api/auth/signup`,
        logout: `/api/auth/logout`,
        refresh: `/api/auth/refresh`,
        verifyEmail: `/api/auth/verify-email`,
        me: `/api/auth/me`,
        selectOrg: `/api/auth/select-org`,
        permissions: `/api/auth/permissions`,
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
