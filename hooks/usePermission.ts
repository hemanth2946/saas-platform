"use client";

import { useAuthStore } from "@/store/auth.store";
import type { Permission } from "@/types";

/**
 * Checks if the current user has a specific permission.
 *
 * - Reads permissions[] from Zustand — zero async, zero loading state.
 * - Returns false if permissionsLoaded is false (not yet fetched).
 * - Pure store read — no side effects.
 *
 * @param permission - The permission string to check
 * @returns true if the user has the permission AND permissions are loaded
 *
 * @example
 * const canInvite = usePermission("iam.invite")
 * if (!canInvite) return null
 */
export function usePermission(permission: Permission): boolean {
    const permissions = useAuthStore((state) => state.permissions);
    const permissionsLoaded = useAuthStore((state) => state.permissionsLoaded);

    if (!permissionsLoaded) return false;
    return permissions.includes(permission);
}

/**
 * Checks multiple permissions at once.
 * Returns a record mapping each permission to true/false.
 * Use this when a component needs to check several permissions
 * to avoid calling usePermission() multiple times.
 *
 * @param permissions - Array of permissions to check
 * @returns Record mapping each permission key to boolean
 *
 * @example
 * const { "iam.invite": canInvite, "iam.remove": canRemove } = usePermissions(["iam.invite", "iam.remove"])
 */
export function usePermissions(
    permissions: Permission[]
): Record<Permission, boolean> {
    const storedPermissions = useAuthStore((state) => state.permissions);
    const permissionsLoaded = useAuthStore((state) => state.permissionsLoaded);

    return permissions.reduce(
        (acc, permission) => {
            acc[permission] = permissionsLoaded
                ? storedPermissions.includes(permission)
                : false;
            return acc;
        },
        {} as Record<Permission, boolean>
    );
}
