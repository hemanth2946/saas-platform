
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type { SessionUser, OrgContext, Plan } from "@/types";

// ============================================
// TYPES
// ============================================

/**
 * Shape of the auth store state
 */
type AuthState = {
    user: SessionUser | null;
    org: OrgContext | null;
    plan: Plan | null;
    isAuthenticated: boolean;
};

/**
 * Auth store actions
 */
type AuthActions = {
    /**
     * Sets auth state after successful login or signup
     * @param user - Logged in user data
     * @param org - Current organisation data
     * @param plan - Current plan
     */
    setAuth: (user: SessionUser, org: OrgContext, plan: Plan) => void;

    /**
     * Clears all auth state on logout
     */
    clearAuth: () => void;

    /**
     * Updates user data — used after profile update
     * @param user - Partial user data to merge
     */
    updateUser: (user: Partial<SessionUser>) => void;

    /**
     * Updates org data — used after org settings update
     * @param org - Partial org data to merge
     */
    updateOrg: (org: Partial<OrgContext>) => void;

    /**
     * Updates just the plan — called after fetching plan config
     * @param plan - New plan value
     */
    setPlan: (plan: Plan) => void;
};

type AuthStore = AuthState & AuthActions;

// ============================================
// INITIAL STATE
// ============================================

const initialState: AuthState = {
    user: null,
    org: null,
    plan: null,
    isAuthenticated: false,
};

// ============================================
// STORE
// ============================================

/**
 * Zustand auth store
 * Persisted to localStorage — survives page refresh
 * Devtools enabled in development for debugging
 *
 * Never store tokens here — tokens live in httpOnly cookies
 * This store holds UI state only (user info, org, plan)
 *
 * @example
 * const { user, org, isAuthenticated } = useAuthStore()
 * const { setAuth, clearAuth } = useAuthStore()
 */
export const useAuthStore = create<AuthStore>()(
    devtools(
        persist(
            (set) => ({
                ...initialState,

                setAuth: (user, org, plan) =>
                    set(
                        { user, org, plan, isAuthenticated: true },
                        false,
                        "auth/setAuth"
                    ),

                clearAuth: () =>
                    set(initialState, false, "auth/clearAuth"),

                updateUser: (userData) =>
                    set(
                        (state) => ({
                            user: state.user ? { ...state.user, ...userData } : null,
                        }),
                        false,
                        "auth/updateUser"
                    ),

                updateOrg: (orgData) =>
                    set(
                        (state) => ({
                            org: state.org ? { ...state.org, ...orgData } : null,
                        }),
                        false,
                        "auth/updateOrg"
                    ),

                setPlan: (plan) =>
                    set({ plan }, false, "auth/setPlan"),
            }),
            {
                name: "auth-storage", // localStorage key
                partialize: (state) => ({
                    // Only persist these fields — never persist sensitive data
                    user: state.user,
                    org: state.org,
                    plan: state.plan,
                    isAuthenticated: state.isAuthenticated,
                }),
            }
        ),
        { name: "AuthStore" }
    )
);