/**
 * lib/api/constants/endpoints.ts
 *
 * All API endpoint paths with /api/v1/ version prefix.
 * Use these constants everywhere — never hardcode endpoint strings.
 *
 * Phase 2D: orgId removed from PLAN.config and FLAGS.list paths.
 * orgId travels via x-org-id header (injected by Axios interceptor).
 */

const V1 = "/api/v1";

export const ENDPOINTS = {
    AUTH: {
        login:       `/api/auth/login`,
        signup:      `/api/auth/signup`,
        logout:      `/api/auth/logout`,
        refresh:     `/api/auth/refresh`,
        verifyEmail: `/api/auth/verify-email`,
        me:          `/api/auth/me`,
        selectOrg:   `/api/auth/select-org`,
        permissions: `/api/auth/permissions`,
    },

    ORG: {
        getOrg:    (orgId: string): string => `${V1}/orgs/${orgId}`,
        updateOrg: (orgId: string): string => `${V1}/orgs/${orgId}`,
        deleteOrg: (orgId: string): string => `${V1}/orgs/${orgId}`,
    },

    /** IAM — users and roles (orgId via header) */
    IAM: {
        users:       `${V1}/users`,
        roles:       `${V1}/roles`,
        invite:      `${V1}/users/invite`,
        user:        (userId: string): string => `${V1}/users/${userId}`,
        inviteToken: (token: string): string  => `${V1}/invite/${token}`,
        acceptInvite:(token: string): string  => `${V1}/invite/${token}/accept`,
    },

    /** Plan config — orgId via x-org-id header */
    PLAN: {
        /** Full plan config endpoint — used by PlanProvider and plan.service.ts */
        config: `${V1}/plan/config`,
        usage:  (orgId: string): string => `${V1}/orgs/${orgId}/plan/usage`,
    },

    /** Feature flags — orgId via x-org-id header */
    FLAGS: {
        /** Feature flags endpoint — used by FlagsProvider and flags.service.ts */
        list: `${V1}/flags`,
    },

    HEALTH: {
        ping: "/api/health",
    },
} as const;
