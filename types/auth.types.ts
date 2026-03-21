// ============================================
// AUTH TYPES
// Shape of logged-in user stored in Zustand auth store
// ============================================

export type SessionUser = {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
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
    org: import("./org.types").OrgContext | null;
    isAuthenticated: boolean;
};