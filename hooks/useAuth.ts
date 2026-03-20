"use client";

import { useAuthStore } from "@/store/auth.store";
import type { Permission } from "@/types";

/**
 * Hook for accessing current auth state
 * Use this in any component that needs user/org/plan info
 *
 * @returns Current auth state — user, org, plan, isAuthenticated
 *
 * @example
 * const { user, org, isAuthenticated } = useAuth()
 * if (!isAuthenticated) return <LoginPrompt />
 */
export function useAuth() {
    const user = useAuthStore((state) => state.user);
    const org = useAuthStore((state) => state.org);
    const plan = useAuthStore((state) => state.plan);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const clearAuth = useAuthStore((state) => state.clearAuth);

    return { user, org, plan, isAuthenticated, clearAuth };
}

/**
 * Hook for checking if current user has a specific permission
 * Permissions come from server — stored in user.permissions array
 *
 * @param permission - Permission string to check
 * @returns true if user has the permission
 *
 * @example
 * const canInvite = usePermission("iam.invite")
 * if (!canInvite) return null
 */
export function usePermission(permission: Permission): boolean {
    const user = useAuthStore((state) => state.user);
    if (!user) return false;
    return user.permissions.includes(permission);
}

/**
 * Hook for checking if current user has any of the given permissions
 *
 * @param permissions - Array of permission strings to check
 * @returns true if user has at least one of the permissions
 *
 * @example
 * const canManage = useAnyPermission(["iam.invite", "iam.remove"])
 */
export function useAnyPermission(permissions: Permission[]): boolean {
    const user = useAuthStore((state) => state.user);
    if (!user) return false;
    return permissions.some((p) => user.permissions.includes(p));
}