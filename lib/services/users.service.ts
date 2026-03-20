/**
 * lib/services/users.service.ts
 *
 * Business logic for user management within an org.
 * Calls users.api.ts and surfaces domain-level return types.
 */

import { usersApi } from "@/lib/api/resources/users.api";
import type { SessionUser } from "@/types/auth.types";
import type { UserRole } from "@/types/permission.types";

/**
 * Returns all users in the given org.
 */
export async function getUsersService(orgId: string): Promise<SessionUser[]> {
    const response = await usersApi.getUsers(orgId);
    return response.data;
}

/**
 * Sends an invitation to a new user with the specified role.
 */
export async function inviteUserService(
    orgId: string,
    data: { email: string; role: UserRole }
): Promise<void> {
    await usersApi.inviteUser(orgId, data);
}

/**
 * Removes a user from the org.
 */
export async function removeUserService(
    orgId: string,
    userId: string
): Promise<void> {
    await usersApi.removeUser(orgId, userId);
}

/**
 * Updates a user's role within the org.
 */
export async function updateUserRoleService(
    orgId: string,
    userId: string,
    role: UserRole
): Promise<SessionUser> {
    const response = await usersApi.updateUserRole(orgId, userId, role);
    return response.data;
}

/**
 * Suspends a user's access to the org.
 */
export async function suspendUserService(
    orgId: string,
    userId: string
): Promise<SessionUser> {
    const response = await usersApi.suspendUser(orgId, userId);
    return response.data;
}
