"use client";

import { useAuthStore } from "@/store/auth.store";

/**
 * Hook for accessing current auth state.
 * Use this in any component that needs user/org/plan info.
 *
 * @example
 * const { user, org, isAuthenticated } = useAuth()
 * if (!isAuthenticated) return <LoginPrompt />
 */
export function useAuth() {
    const user = useAuthStore((state) => state.user);
    const org = useAuthStore((state) => state.org);
    const plan = useAuthStore((state) => state.plan);
    const orgs = useAuthStore((state) => state.orgs);
    const roles = useAuthStore((state) => state.roles);
    const permissions = useAuthStore((state) => state.permissions);
    const permissionsLoaded = useAuthStore((state) => state.permissionsLoaded);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const clearAuth = useAuthStore((state) => state.clearAuth);

    return {
        user,
        org,
        plan,
        orgs,
        roles,
        permissions,
        permissionsLoaded,
        isAuthenticated,
        clearAuth,
    };
}
