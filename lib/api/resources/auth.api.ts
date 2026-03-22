/**
 * lib/api/resources/auth.api.ts
 *
 * Raw HTTP functions for the auth domain.
 * No business logic — that lives in lib/services/auth.service.ts.
 * Auth is httpOnly cookie-based; no tokens are passed in request bodies.
 */

import { internalClient } from "@/lib/api/clients/internal.client";
import { ENDPOINTS } from "@/lib/api/constants/endpoints";
import type { ApiResponse } from "@/types/api.types";
import type { SessionUser } from "@/types/auth.types";
import type { OrgContext } from "@/types/org.types";
import type { OrgSummary } from "@/types/org-summary.types";
import type { OrgPlanSummary } from "@/types/plan.types";
import type { Permission, UserRole } from "@/types/permission.types";
import type { LoginInput, SignupInput } from "@/lib/validations/auth.schema";

// ============================================
// RESPONSE SHAPES
// ============================================

export type LoginResponseData = {
    user: SessionUser;
    orgs: OrgSummary[];
};

export type SelectOrgResponseData = {
    org: OrgContext;
    plan: OrgPlanSummary;
};

export type PermissionsResponseData = {
    permissions: Permission[];
    role: UserRole;
};

// ============================================
// API FUNCTIONS
// ============================================

export const authApi = {
    /**
     * Authenticates a user and sets httpOnly cookies.
     * Returns user + list of all orgs the user belongs to.
     * No org is selected yet — call selectOrg() next.
     */
    login(data: LoginInput): Promise<ApiResponse<LoginResponseData>> {
        return internalClient
            .post<ApiResponse<LoginResponseData>>(ENDPOINTS.AUTH.login, data)
            .then((r) => r.data);
    },

    /**
     * Creates a new user + org and sets httpOnly cookies.
     */
    signup(data: SignupInput): Promise<ApiResponse<LoginResponseData>> {
        return internalClient
            .post<ApiResponse<LoginResponseData>>(ENDPOINTS.AUTH.signup, data)
            .then((r) => r.data);
    },

    /**
     * Scopes the session to a specific org.
     * Issues new org-scoped JWT cookies.
     * Returns org context + plan config.
     */
    selectOrg(orgId: string): Promise<ApiResponse<SelectOrgResponseData>> {
        return internalClient
            .post<ApiResponse<SelectOrgResponseData>>(ENDPOINTS.AUTH.selectOrg, { orgId })
            .then((r) => r.data);
    },

    /**
     * Fetches fresh permissions for the current org-scoped user.
     * Always reads from DB — never from the JWT.
     * Called from [orgId]/layout.tsx on mount.
     */
    getPermissions(): Promise<ApiResponse<PermissionsResponseData>> {
        return internalClient
            .get<ApiResponse<PermissionsResponseData>>(ENDPOINTS.AUTH.permissions)
            .then((r) => r.data);
    },

    /**
     * Invalidates the session and clears cookies.
     */
    logout(): Promise<ApiResponse<null>> {
        return internalClient
            .post<ApiResponse<null>>(ENDPOINTS.AUTH.logout)
            .then((r) => r.data);
    },

    /**
     * Rotates the access token using the refresh cookie.
     */
    refreshToken(): Promise<ApiResponse<null>> {
        return internalClient
            .post<ApiResponse<null>>(ENDPOINTS.AUTH.refresh)
            .then((r) => r.data);
    },

    /**
     * Verifies the user's email address with the token from the email link.
     */
    verifyEmail(token: string): Promise<ApiResponse<null>> {
        return internalClient
            .post<ApiResponse<null>>(ENDPOINTS.AUTH.verifyEmail, { token })
            .then((r) => r.data);
    },

    /**
     * Returns the currently authenticated user.
     */
    getMe(): Promise<ApiResponse<SessionUser>> {
        return internalClient
            .get<ApiResponse<SessionUser>>(ENDPOINTS.AUTH.me)
            .then((r) => r.data);
    },
};
