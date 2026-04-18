"use client";

/**
 * hooks/useIAM.ts
 *
 * TanStack Query hooks for all IAM operations.
 * Phase 2D — Identity and Access Management.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getUsers,
    getRoles,
    inviteUser,
    updateUser,
    removeUser,
    validateInvite,
    acceptInvite,
} from "@/lib/api/iam.service";
import { iamKeys } from "@/lib/query/keys/iam.keys";
import type {
    GetUsersResponse,
    GetRolesResponse,
    InviteUserRequest,
    UpdateUserRequest,
    IAMUser,
} from "@/types";
import type { GetUsersParams } from "@/lib/api/iam.service";

// ── useUsers ──────────────────────────────────────────────────────────────────

interface UseUsersResult {
    users:      IAMUser[];
    total:      number;
    seatUsed:   number;
    seatLimit:  number | null;
    isLoading:  boolean;
    isError:    boolean;
    error:      unknown;
    refetch:    () => void;
}

export function useUsers(params?: GetUsersParams): UseUsersResult {
    const { data, isLoading, isError, error, refetch } = useQuery<GetUsersResponse>({
        queryKey:  iamKeys.users(params),
        queryFn:   () => getUsers(params),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    return {
        users:     data?.users     ?? [],
        total:     data?.total     ?? 0,
        seatUsed:  data?.seatUsed  ?? 0,
        seatLimit: data?.seatLimit ?? null,
        isLoading,
        isError,
        error,
        refetch:   () => void refetch(),
    };
}

// ── useRoles ──────────────────────────────────────────────────────────────────

interface UseRolesResult {
    quickRoles:   GetRolesResponse["quickRoles"];
    serviceBased: GetRolesResponse["serviceBased"];
    isLoading:    boolean;
    isError:      boolean;
}

export function useRoles(): UseRolesResult {
    const { data, isLoading, isError } = useQuery<GetRolesResponse>({
        queryKey:  iamKeys.roles(),
        queryFn:   getRoles,
        staleTime: 10 * 60 * 1000, // 10 minutes — roles change rarely
    });

    return {
        quickRoles:   data?.quickRoles   ?? [],
        serviceBased: data?.serviceBased ?? [],
        isLoading,
        isError,
    };
}

// ── useInviteUser ─────────────────────────────────────────────────────────────

export function useInviteUser() {
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: (data: InviteUserRequest) => inviteUser(data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: iamKeys.users() });
        },
    });

    return { mutate, isPending };
}

// ── useUpdateUser ─────────────────────────────────────────────────────────────

export function useUpdateUser() {
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: UpdateUserRequest }) =>
            updateUser(userId, data),

        onMutate: async ({ userId, data }) => {
            // Cancel in-flight queries
            await queryClient.cancelQueries({ queryKey: iamKeys.users() });

            // Snapshot previous state for rollback
            const previous = queryClient.getQueryData<GetUsersResponse>(iamKeys.users());

            // Optimistic update
            if (previous && data.status) {
                const statusMap: Record<string, IAMUser["status"]> = {
                    ACTIVE:    "active",
                    SUSPENDED: "suspended",
                };
                const newStatus = statusMap[data.status];
                if (newStatus) {
                    queryClient.setQueryData<GetUsersResponse>(iamKeys.users(), {
                        ...previous,
                        users: previous.users.map((u) =>
                            u.id === userId ? { ...u, status: newStatus } : u
                        ),
                    });
                }
            }

            return { previous };
        },

        onError: (_err, _vars, context) => {
            // Rollback on error
            if (context?.previous) {
                queryClient.setQueryData(iamKeys.users(), context.previous);
            }
        },

        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: iamKeys.users() });
        },
    });

    return { mutate, isPending };
}

// ── useRemoveUser ─────────────────────────────────────────────────────────────

export function useRemoveUser() {
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: (userId: string) => removeUser(userId),

        onMutate: async (userId) => {
            await queryClient.cancelQueries({ queryKey: iamKeys.users() });

            const previous = queryClient.getQueryData<GetUsersResponse>(iamKeys.users());

            // Optimistic remove
            if (previous) {
                queryClient.setQueryData<GetUsersResponse>(iamKeys.users(), {
                    ...previous,
                    users:    previous.users.filter((u) => u.id !== userId),
                    total:    Math.max(0, previous.total - 1),
                    seatUsed: Math.max(0, previous.seatUsed - 1),
                });
            }

            return { previous };
        },

        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(iamKeys.users(), context.previous);
            }
        },

        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: iamKeys.users() });
        },
    });

    return { mutate, isPending };
}

// ── useValidateInvite ─────────────────────────────────────────────────────────

export function useValidateInvite(token: string) {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: iamKeys.invite(token),
        queryFn:  () => validateInvite(token),
        enabled:  !!token,
        retry:    false, // No retry on 404/410/409
    });

    // Extract error code from Axios error response
    const axiosError = error as { response?: { data?: { error?: { reason?: string } } } } | null;
    const errorCode  = axiosError?.response?.data?.error?.reason ?? null;

    return { invite: data ?? null, isLoading, isError, error, errorCode };
}

// ── useAcceptInvite ───────────────────────────────────────────────────────────

export function useAcceptInvite() {
    const { mutate, isPending, isSuccess, isError } = useMutation({
        mutationFn: ({ token, data }: { token: string; data: { name: string; password: string } }) =>
            acceptInvite(token, data),
    });

    return { mutate, isPending, isSuccess, isError };
}
