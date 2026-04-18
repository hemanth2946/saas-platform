/**
 * lib/api/iam.service.ts
 *
 * IAM service for Phase 2D.
 * All endpoints use header-based orgId (x-org-id injected by Axios interceptor).
 *
 * Error handling is performed by the Axios response interceptor.
 * Do not add duplicate try/catch here — let errors propagate to TanStack Query.
 */

import { internalClient } from "@/lib/api/clients/internal.client";
import { ENDPOINTS } from "@/lib/api/constants/endpoints";
import type {
    ApiResponse,
    GetUsersResponse,
    GetRolesResponse,
    InviteUserRequest,
    UpdateUserRequest,
    InviteValidationResponse,
    UserStatus,
} from "@/types";

// ── Users ─────────────────────────────────────────────────────────────────────

export interface GetUsersParams {
    search?: string;
    status?: UserStatus;
    page?:   number;
    limit?:  number;
}

export async function getUsers(params?: GetUsersParams): Promise<GetUsersResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    if (params?.page)   query.set("page",   String(params.page));
    if (params?.limit)  query.set("limit",  String(params.limit));

    const url = query.toString()
        ? `${ENDPOINTS.IAM.users}?${query.toString()}`
        : ENDPOINTS.IAM.users;

    const response = await internalClient.get<ApiResponse<GetUsersResponse>>(url);
    return response.data.data;
}

// ── Roles ─────────────────────────────────────────────────────────────────────

export async function getRoles(): Promise<GetRolesResponse> {
    const response = await internalClient.get<ApiResponse<GetRolesResponse>>(
        ENDPOINTS.IAM.roles
    );
    return response.data.data;
}

// ── Invite ────────────────────────────────────────────────────────────────────

export async function inviteUser(data: InviteUserRequest): Promise<{ inviteId: string }> {
    const response = await internalClient.post<ApiResponse<{ inviteId: string }>>(
        ENDPOINTS.IAM.invite,
        data
    );
    return response.data.data;
}

// ── Update user ───────────────────────────────────────────────────────────────

export async function updateUser(
    userId: string,
    data:   UpdateUserRequest
): Promise<{ userId: string }> {
    const response = await internalClient.patch<ApiResponse<{ userId: string }>>(
        ENDPOINTS.IAM.user(userId),
        data
    );
    return response.data.data;
}

// ── Remove user ───────────────────────────────────────────────────────────────

export async function removeUser(userId: string): Promise<{ userId: string }> {
    const response = await internalClient.delete<ApiResponse<{ userId: string }>>(
        ENDPOINTS.IAM.user(userId)
    );
    return response.data.data;
}

// ── Invite validation (public) ────────────────────────────────────────────────

export async function validateInvite(
    token: string
): Promise<InviteValidationResponse> {
    const response = await internalClient.get<ApiResponse<InviteValidationResponse>>(
        ENDPOINTS.IAM.inviteToken(token)
    );
    return response.data.data;
}

// ── Accept invite (public) ────────────────────────────────────────────────────

export async function acceptInvite(
    token: string,
    data:  { name: string; password: string }
): Promise<void> {
    await internalClient.post(ENDPOINTS.IAM.acceptInvite(token), data);
}
