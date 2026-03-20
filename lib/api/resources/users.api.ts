/**
 * lib/api/resources/users.api.ts
 *
 * Raw HTTP functions for the users domain.
 * Business logic lives in lib/services/users.service.ts.
 */

import { internalClient } from "@/lib/api/clients/internal.client";
import { ENDPOINTS } from "@/lib/api/constants/endpoints";
import type { ApiResponse } from "@/types/api.types";
import type { SessionUser } from "@/types/auth.types";
import type { UserRole } from "@/types/permission.types";

export const usersApi = {
    /**
     * Lists all users in the given org.
     */
    getUsers(orgId: string): Promise<ApiResponse<SessionUser[]>> {
        return internalClient
            .get<ApiResponse<SessionUser[]>>(ENDPOINTS.USERS.list(orgId))
            .then((r) => r.data);
    },

    /**
     * Sends an invitation email to a new user.
     */
    inviteUser(
        orgId: string,
        data: { email: string; role: UserRole }
    ): Promise<ApiResponse<null>> {
        return internalClient
            .post<ApiResponse<null>>(ENDPOINTS.USERS.invite(orgId), data)
            .then((r) => r.data);
    },

    /**
     * Removes a user from the org.
     */
    removeUser(orgId: string, userId: string): Promise<ApiResponse<null>> {
        return internalClient
            .delete<ApiResponse<null>>(ENDPOINTS.USERS.remove(orgId, userId))
            .then((r) => r.data);
    },

    /**
     * Updates a user's role within the org.
     */
    updateUserRole(
        orgId: string,
        userId: string,
        role: UserRole
    ): Promise<ApiResponse<SessionUser>> {
        return internalClient
            .patch<ApiResponse<SessionUser>>(
                ENDPOINTS.USERS.updateRole(orgId, userId),
                { role }
            )
            .then((r) => r.data);
    },

    /**
     * Suspends a user's access to the org.
     */
    suspendUser(
        orgId: string,
        userId: string
    ): Promise<ApiResponse<SessionUser>> {
        return internalClient
            .post<ApiResponse<SessionUser>>(
                ENDPOINTS.USERS.suspend(orgId, userId)
            )
            .then((r) => r.data);
    },
};
