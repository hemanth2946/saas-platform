// ============================================
// IAM TYPES
// Phase 2D — Identity and Access Management
// Import from "@/types" — never from this file directly
// ============================================

import type { Permission } from "./permission.types";

// ── UserRole join record (DB shape) ──────────────────────────────────────────

export interface UserRoleRecord {
    userId: string;
    roleId: string;
    createdAt: string;
}

// ── Full role shape from API ──────────────────────────────────────────────────

export interface RoleRecord {
    id: string;
    name: string;
    type: "QUICK" | "SERVICE_BASED";
    serviceKey: string | null;
    description: string | null;
    orgId: string;
    permissions: Permission[];
}

// ── Service group for role selector UI ───────────────────────────────────────

export interface ServiceRoleGroup {
    serviceKey: string;
    serviceName: string;
    description: string;
    roles: RoleRecord[];
}

// ── IAM user (what the users list returns) ───────────────────────────────────

export interface IAMUser {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    status: UserStatus;
    lastLogin: string | null;
    invitedAt: string | null;
    invitationAccepted: boolean;
    roles: RoleRecord[];
    roleCount: number;
}

// ── Invite record ─────────────────────────────────────────────────────────────

export interface InviteRecord {
    id: string;
    email: string;
    roleIds: string[];
    token: string;
    expiresAt: string;
    acceptedAt: string | null;
    orgId: string;
}

// ── Invite validation (public GET /api/v1/invite/[token]) ────────────────────

export interface InviteValidationResponse {
    email: string;
    orgName: string;
    orgLogo: string | null;
    expiresAt: string;
}

// ── API request/response types ───────────────────────────────────────────────

export interface GetUsersResponse {
    users: IAMUser[];
    total: number;
    seatUsed: number;
    seatLimit: number | null;
}

export interface GetRolesResponse {
    quickRoles: RoleRecord[];
    serviceBased: ServiceRoleGroup[];
}

export interface InviteUserRequest {
    email: string;
    roleIds: string[];
}

export interface UpdateUserRequest {
    roleIds?: string[];
    status?: "ACTIVE" | "SUSPENDED";
}

export interface AcceptInviteRequest {
    password: string;
    name: string;
}

// ── User status ───────────────────────────────────────────────────────────────
// Matches userStatusVariants keys in features/iam/constants/iam.variants.ts

export type UserStatus = "active" | "pending" | "suspended" | "expired" | "invited";
