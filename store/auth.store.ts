
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type { SessionUser, OrgContext, OrgSummary } from "@/types";
import type { Permission, UserRole } from "@/types";
import type { PlanConfig } from "@/types";

// ============================================
// TYPES
// ============================================

type AuthState = {
    user: SessionUser | null;
    org: OrgContext | null;
    plan: PlanConfig | null;
    orgs: OrgSummary[];
    permissions: Permission[];
    role: UserRole | null;
    permissionsLoaded: boolean;
    isAuthenticated: boolean;
};

type AuthActions = {
    /**
     * Called after login API succeeds.
     * Stores user and their org list. org is NOT set yet.
     */
    setLoginData: (user: SessionUser, orgs: OrgSummary[]) => void;

    /**
     * Called after select-org API succeeds.
     * Stores the selected org and plan config.
     */
    setOrgSession: (org: OrgContext, plan: PlanConfig) => void;

    /**
     * Called after GET /api/auth/permissions succeeds.
     * Stores permissions and role; marks permissionsLoaded = true.
     */
    setPermissions: (permissions: Permission[], role: UserRole) => void;

    /**
     * Stores org list — used when refreshing orgs list separately.
     */
    setOrgs: (orgs: OrgSummary[]) => void;

    /**
     * Clears org-scoped session: org, plan, permissions, role, permissionsLoaded.
     * Called before switching orgs so stale data is never shown.
     */
    clearOrgSession: () => void;

    /**
     * Clears all auth state on logout.
     */
    clearAuth: () => void;

    /**
     * Updates partial user data — used after profile update.
     */
    updateUser: (user: Partial<SessionUser>) => void;

    /**
     * Updates partial org data — used after org settings update.
     */
    updateOrg: (org: Partial<OrgContext>) => void;

    /**
     * Updates just the plan — called after plan change.
     */
    setPlan: (plan: PlanConfig) => void;
};

type AuthStore = AuthState & AuthActions;

// ============================================
// INITIAL STATE
// ============================================

const initialState: AuthState = {
    user: null,
    org: null,
    plan: null,
    orgs: [],
    permissions: [],
    role: null,
    permissionsLoaded: false,
    isAuthenticated: false,
};

// ============================================
// STORE
// ============================================

/**
 * Zustand auth store
 *
 * Persisted fields: user, org, plan, orgs, isAuthenticated
 * NOT persisted: permissions, role, permissionsLoaded
 * (permissions are always fetched fresh after org selection)
 *
 * @example
 * const { user, org, isAuthenticated } = useAuthStore()
 * const { setLoginData, clearAuth } = useAuthStore()
 */
export const useAuthStore = create<AuthStore>()(
    devtools(
        persist(
            (set, get) => ({
                ...initialState,

                setLoginData: (user, orgs) =>
                    set(
                        {
                            user,
                            orgs,
                            org: null,
                            plan: null,
                            permissions: [],
                            role: null,
                            permissionsLoaded: false,
                            isAuthenticated: true,
                        },
                        false,
                        "auth/setLoginData"
                    ),

                setOrgSession: (org, plan) =>
                    set(
                        {
                            org,
                            plan,
                            permissions: [],
                            role: null,
                            permissionsLoaded: false,
                        },
                        false,
                        "auth/setOrgSession"
                    ),

                setPermissions: (permissions, role) =>
                    set(
                        { permissions, role, permissionsLoaded: true },
                        false,
                        "auth/setPermissions"
                    ),

                setOrgs: (orgs) =>
                    set({ orgs }, false, "auth/setOrgs"),

                clearOrgSession: () => {
                    const { user, orgs, isAuthenticated } = get();
                    set(
                        {
                            ...initialState,
                            user,
                            orgs,
                            isAuthenticated,
                        },
                        false,
                        "auth/clearOrgSession"
                    );
                },

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
                name: "auth-storage",
                partialize: (state) => ({
                    // Only persist non-sensitive UI state
                    user: state.user,
                    org: state.org,
                    plan: state.plan,
                    orgs: state.orgs,
                    isAuthenticated: state.isAuthenticated,
                    // permissions, role, permissionsLoaded are NEVER persisted
                }),
            }
        ),
        { name: "AuthStore" }
    )
);
