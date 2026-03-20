/**
 * lib/services/auth.service.ts
 *
 * Business logic for authentication.
 * Calls auth.api.ts for HTTP operations and syncs the Zustand auth store.
 * Re-throws errors so form handlers can process fieldErrors.
 */

import { authApi } from "@/lib/api/resources/auth.api";
import { useAuthStore } from "@/store/auth.store";
import type { LoginInput, SignupInput } from "@/lib/validations/auth.schema";
import type { SessionUser } from "@/types/auth.types";

/**
 * Logs the user in, updates the auth store, and redirects to their dashboard.
 * Throws on error so the calling form can handle fieldErrors.
 */
export async function loginService(data: LoginInput): Promise<void> {
    const response = await authApi.login(data);

    useAuthStore.getState().setAuth(
        response.data.user,
        response.data.org,
        response.data.plan
    );

    if (typeof window !== "undefined") {
        window.location.href = `/${response.data.org.slug}/dashboard`;
    }
}

/**
 * Signs up a new user + org, updates the auth store, and redirects.
 * Throws on error so the calling form can handle fieldErrors.
 */
export async function signupService(data: SignupInput): Promise<void> {
    const response = await authApi.signup(data);

    useAuthStore.getState().setAuth(
        response.data.user,
        response.data.org,
        response.data.plan
    );

    if (typeof window !== "undefined") {
        window.location.href = `/${response.data.org.slug}/dashboard`;
    }
}

/**
 * Logs the user out and redirects to /login.
 * Always clears auth state — even if the API call fails.
 */
export async function logoutService(): Promise<void> {
    try {
        await authApi.logout();
    } finally {
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
    }
}

/**
 * Returns the currently authenticated user from the server.
 */
export async function getMeService(): Promise<SessionUser> {
    const response = await authApi.getMe();
    return response.data;
}
