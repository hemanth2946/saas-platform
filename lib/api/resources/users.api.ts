/**
 * lib/api/resources/users.api.ts
 *
 * Raw HTTP functions for the users domain.
 * NOTE: Superseded by lib/api/iam.service.ts for Phase 2D+.
 * orgId is accepted but not used in the URL — it travels via x-org-id header.
 */

import { internalClient } from "@/lib/api/clients/internal.client";
import { ENDPOINTS } from "@/lib/api/constants/endpoints";
import type { ApiResponse } from "@/types/api.types";
import type { SessionUser } from "@/types/auth.types";
import type { UserRole } from "@/types/permission.types";

export const usersApi = {
    getUsers(_orgId: string): Promise<ApiResponse<SessionUser[]>> {
        return internalClient
            .get<ApiResponse<SessionUser[]>>(ENDPOINTS.IAM.users)
            .then((r) => r.data);
    },

    inviteUser(_orgId: string, data: { email: string; role: UserRole }): Promise<ApiResponse<null>> {
        return internalClient
            .post<ApiResponse<null>>(ENDPOINTS.IAM.invite, data)
            .then((r) => r.data);
    },

    removeUser(_orgId: string, userId: string): Promise<ApiResponse<null>> {
        return internalClient
            .delete<ApiResponse<null>>(ENDPOINTS.IAM.user(userId))
            .then((r) => r.data);
    },

    updateUserRole(_orgId: string, userId: string, role: UserRole): Promise<ApiResponse<SessionUser>> {
        return internalClient
            .patch<ApiResponse<SessionUser>>(ENDPOINTS.IAM.user(userId), { roleIds: [role] })
            .then((r) => r.data);
    },

    suspendUser(_orgId: string, userId: string): Promise<ApiResponse<SessionUser>> {
        return internalClient
            .post<ApiResponse<SessionUser>>(`${ENDPOINTS.IAM.user(userId)}/suspend`)
            .then((r) => r.data);
    },
};
