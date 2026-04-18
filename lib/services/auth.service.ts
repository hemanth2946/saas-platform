/**
 * lib/services/auth.service.ts
 *
 * Business logic for authentication.
 * Calls auth.api.ts for HTTP and syncs the Zustand auth store.
 * Re-throws errors so form handlers can process fieldErrors.
 */

import { authApi } from "@/lib/api/resources/auth.api";
import { useAuthStore } from "@/store/auth.store";
import type { LoginInput, SignupInput } from "@/lib/validations/auth.schema";
import type { SessionUser } from "@/types/auth.types";
import type { OrgContext } from "@/types/org.types";

/**
 * Logs the user in and stores user + orgs list in Zustand.
 * Does NOT redirect — the calling hook decides where to send the user
 * based on orgs.length (single org → auto select-org, multi → /select-org).
 * Throws on error so the calling form can handle fieldErrors.
 */
export async function loginService(data: LoginInput): Promise<{ orgs: ReturnType<typeof useAuthStore.getState>["orgs"] }> {
    const response = await authApi.login(data);
    const { user, orgs } = response.data;

    useAuthStore.getState().setLoginData(user, orgs);

    return { orgs };
}

/**
 * Scopes the session to the given org.
 * Stores org + plan in Zustand and returns the org slug for redirect.
 * Throws on error.
 */
export async function selectOrgService(orgId: string): Promise<{ slug: string }> {
    const response = await authApi.selectOrg(orgId);
    const { org, plan } = response.data;

    useAuthStore.getState().setOrgSession(org, plan);

    return { slug: org.slug };
}

/**
 * Fetches fresh permissions for the current org-scoped user.
 * Stores permissions + role in Zustand.
 * Throws on error.
 */
export async function loadPermissionsService(): Promise<void> {
    const response = await authApi.getPermissions();
    const { permissions, roles } = response.data;

    useAuthStore.getState().setPermissions(permissions, roles);
}

/**
 * Signs up a new user + org, updates the auth store, and redirects.
 * Throws on error so the calling form can handle fieldErrors.
 */
export async function signupService(data: SignupInput): Promise<void> {
    const response = await authApi.signup(data);
    const { user, orgs } = response.data;

    useAuthStore.getState().setLoginData(user, orgs);

    // After signup there is always exactly 1 org — auto-select it
    if (orgs.length > 0) {
        await selectOrgService(orgs[0].id);
        if (typeof window !== "undefined") {
            window.location.href = `/${orgs[0].slug}/dashboard`;
        }
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
