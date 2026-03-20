// ============================================
// AUTH TYPES
// Shape of logged-in user stored in Zustand auth store
// ============================================

import { UserRole } from "./permission.types";
import { Plan } from "./plan.types";

export type SessionUser = {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
    role: UserRole;
    orgId: string;
    permissions: string[]; // actual permission strings from server
    isVerified: boolean;
    lastLogin?: string | null;
};

export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // seconds
};

export type AuthState = {
    user: SessionUser | null;
    tokens: AuthTokens | null;
    org: import("./org.types").OrgContext | null;
    plan: Plan | null;
    isAuthenticated: boolean;
};