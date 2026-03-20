/**
 * lib/api/constants/endpoints.ts
 *
 * All API endpoint paths with /api/v1/ version prefix.
 * Use these constants everywhere — never hardcode endpoint strings.
 */

const API = "/api";

export const ENDPOINTS = {
    AUTH: {
        login: `${API}/auth/login`,
        signup: `${API}/auth/signup`,
        logout: `${API}/auth/logout`,
        refresh: `${API}/auth/refresh`,
        verifyEmail: `${API}/auth/verify`,
        me: `${API}/auth/me`,
    },

    ORG: {
        getOrg: (orgId: string): string => `${API}/orgs/${orgId}`,
        updateOrg: (orgId: string): string => `${API}/orgs/${orgId}`,
        deleteOrg: (orgId: string): string => `${API}/orgs/${orgId}`,
    },

    USERS: {
        list: (orgId: string): string => `${API}/orgs/${orgId}/users`,
        invite: (orgId: string): string => `${API}/orgs/${orgId}/users/invite`,
        remove: (orgId: string, userId: string): string =>
            `${API}/orgs/${orgId}/users/${userId}`,
        updateRole: (orgId: string, userId: string): string =>
            `${API}/orgs/${orgId}/users/${userId}/role`,
        suspend: (orgId: string, userId: string): string =>
            `${API}/orgs/${orgId}/users/${userId}/suspend`,
    },

    PLAN: {
        config: (orgId: string): string => `${API}/orgs/${orgId}/plan`,
        usage: (orgId: string): string => `${API}/orgs/${orgId}/plan/usage`,
    },

    HEALTH: {
        ping: "/api/health",
    },
} as const;
