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
import type { Plan } from "@/types/plan.types";
import type { LoginInput, SignupInput } from "@/lib/validations/auth.schema";

type AuthSuccessData = {
    user: SessionUser;
    org: OrgContext;
    plan: Plan;
};

export const authApi = {
    /**
     * Authenticates a user and sets httpOnly cookies.
     */
    login(data: LoginInput): Promise<ApiResponse<AuthSuccessData>> {
        return internalClient
            .post<ApiResponse<AuthSuccessData>>(ENDPOINTS.AUTH.login, data)
            .then((r) => r.data);
    },

    /**
     * Creates a new user + org and sets httpOnly cookies.
     */
    signup(data: SignupInput): Promise<ApiResponse<AuthSuccessData>> {
        return internalClient
            .post<ApiResponse<AuthSuccessData>>(ENDPOINTS.AUTH.signup, data)
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
