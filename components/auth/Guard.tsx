"use client";

import { useAuthStore } from "@/store/auth.store";
import type { Permission } from "@/types";

// ============================================
// SHARED HOOK HELPERS (module-level, not components)
// ============================================

function useHasPermission(permission: Permission): boolean {
    const permissions = useAuthStore((state) => state.permissions);
    const permissionsLoaded = useAuthStore((state) => state.permissionsLoaded);
    if (!permissionsLoaded) return false;
    return permissions.includes(permission);
}

function useHasAnyPermission(permissions: Permission[]): boolean {
    const stored = useAuthStore((state) => state.permissions);
    const permissionsLoaded = useAuthStore((state) => state.permissionsLoaded);
    if (!permissionsLoaded) return false;
    return permissions.some((p) => stored.includes(p));
}

function useHasAllPermissions(permissions: Permission[]): boolean {
    const stored = useAuthStore((state) => state.permissions);
    const permissionsLoaded = useAuthStore((state) => state.permissionsLoaded);
    if (!permissionsLoaded) return false;
    return permissions.every((p) => stored.includes(p));
}

// ============================================
// <Guard> — Single permission check (AND-1)
// ============================================

type GuardProps = {
    /** The permission the user must have to see children. */
    permission: Permission;
    /** Optional content rendered when the user lacks permission. */
    fallback?: React.ReactNode;
    children: React.ReactNode;
};

/**
 * Renders children only if the current user has the given permission.
 * Renders fallback (or null) when they do not.
 *
 * @example
 * <Guard permission="iam.invite">
 *   <InviteButton />
 * </Guard>
 *
 * <Guard permission="billing.manage" fallback={<UpgradeBanner />}>
 *   <BillingSettings />
 * </Guard>
 */
export function Guard({ permission, fallback = null, children }: GuardProps) {
    const allowed = useHasPermission(permission);
    return allowed ? <>{children}</> : <>{fallback}</>;
}

// ============================================
// <GuardAny> — OR logic (any one grants access)
// ============================================

type GuardAnyProps = {
    /** User needs at least ONE of these permissions. */
    permissions: Permission[];
    fallback?: React.ReactNode;
    children: React.ReactNode;
};

/**
 * Renders children if the user has AT LEAST ONE of the given permissions.
 *
 * @example
 * <GuardAny permissions={["iam.invite", "iam.remove"]}>
 *   <MemberActions />
 * </GuardAny>
 */
export function GuardAny({ permissions, fallback = null, children }: GuardAnyProps) {
    const allowed = useHasAnyPermission(permissions);
    return allowed ? <>{children}</> : <>{fallback}</>;
}

// ============================================
// <GuardAll> — AND logic (must have all)
// ============================================

type GuardAllProps = {
    /** User must have ALL of these permissions. */
    permissions: Permission[];
    fallback?: React.ReactNode;
    children: React.ReactNode;
};

/**
 * Renders children only if the user has ALL of the given permissions.
 *
 * @example
 * <GuardAll permissions={["iam.manage", "billing.manage"]}>
 *   <AdminPanel />
 * </GuardAll>
 */
export function GuardAll({ permissions, fallback = null, children }: GuardAllProps) {
    const allowed = useHasAllPermissions(permissions);
    return allowed ? <>{children}</> : <>{fallback}</>;
}
