import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type { SessionUser, OrgContext, OrgSummary } from "@/types";
import type { Permission, UserRole } from "@/types";
import type { OrgPlanSummary } from "@/types";
import { clearPlanFeatures } from "@/store/plan-features.store";
import { clearFeatureFlags } from "@/store/feature-flags.store";

// ============================================
// TYPES
// ============================================

type AuthState = {
    user:              SessionUser | null;
    org:               OrgContext | null;
    /**
     * Lightweight plan summary from select-org.
     * Full plan config (features, entitlements, limits) lives in plan-features.store.ts.
     */
    plan:              OrgPlanSummary | null;
    orgs:              OrgSummary[];
    permissions:       Permission[];
    /**
     * All roles the user holds in the current org.
     * Populated after GET /api/auth/permissions succeeds.
     * Never persisted — always fetched fresh after org selection.
     */
    roles:             UserRole[];
    permissionsLoaded: boolean;
    isAuthenticated:   boolean;
};

type AuthActions = {
    /**
     * Called after login API succeeds.
     * Stores user and their org list. org is NOT set yet.
     */
    setLoginData: (user: SessionUser, orgs: OrgSummary[]) => void;

    /**
     * Called after select-org API succeeds.
     * Stores the selected org and lightweight plan summary.
     */
    setOrgSession: (org: OrgContext, plan: OrgPlanSummary) => void;

    /**
     * Called after GET /api/auth/permissions succeeds.
     * Stores permissions and roles; marks permissionsLoaded = true.
     */
    setPermissions: (permissions: Permission[], roles: UserRole[]) => void;

    /**
     * Stores org list — used when refreshing orgs list separately.
     */
    setOrgs: (orgs: OrgSummary[]) => void;

    /**
     * Clears org-scoped session: org, plan, permissions, roles, permissionsLoaded.
     * Also clears plan features store so stale plan state is never shown.
     * Called before switching orgs.
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
     * Updates just the plan summary — called after plan change.
     */
    setPlan: (plan: OrgPlanSummary) => void;
};

type AuthStore = AuthState & AuthActions;

// ============================================
// INITIAL STATE
// ============================================

const initialState: AuthState = {
    user:              null,
    org:               null,
    plan:              null,
    orgs:              [],
    permissions:       [],
    roles:             [],
    permissionsLoaded: false,
    isAuthenticated:   false,
};

// ============================================
// STORE
// ============================================

/**
 * Zustand auth store
 *
 * Persisted fields: user, org, plan, orgs, isAuthenticated
 * NOT persisted: permissions, roles, permissionsLoaded
 * (permissions/roles are always fetched fresh after org selection)
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
                            org:               null,
                            plan:              null,
                            permissions:       [],
                            roles:             [],
                            permissionsLoaded: false,
                            isAuthenticated:   true,
                        },
                        false,
                        "auth/setLoginData"
                    ),

                setOrgSession: (org, plan) =>
                    set(
                        {
                            org,
                            plan,
                            permissions:       [],
                            roles:             [],
                            permissionsLoaded: false,
                        },
                        false,
                        "auth/setOrgSession"
                    ),

                setPermissions: (permissions, roles) =>
                    set(
                        { permissions, roles, permissionsLoaded: true },
                        false,
                        "auth/setPermissions"
                    ),

                setOrgs: (orgs) =>
                    set({ orgs }, false, "auth/setOrgs"),

                clearOrgSession: () => {
                    // Clear plan features and feature flags alongside auth — prevents stale data
                    clearPlanFeatures();
                    clearFeatureFlags();

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
                name:    "auth-storage",
                version: 2,
                /**
                 * v0 → v1: plan field changed from PlanConfig (rich) to OrgPlanSummary (lightweight).
                 * v1 → v2: role: UserRole | null → roles: UserRole[].
                 */
                migrate: (persistedState, version) => {
                    const s = (persistedState ?? {}) as Record<string, unknown>;
                    if (version === 0) {
                        s.plan = null;
                    }
                    if (version <= 1) {
                        // role (single) → roles (array); clear both to force fresh fetch
                        delete s.role;
                        s.roles = [];
                        s.permissions = [];
                        s.permissionsLoaded = false;
                    }
                    return s as unknown as AuthState;
                },
                partialize: (state) => ({
                    // Only persist non-sensitive UI state
                    user:            state.user,
                    org:             state.org,
                    plan:            state.plan,
                    orgs:            state.orgs,
                    isAuthenticated: state.isAuthenticated,
                    // permissions, roles, permissionsLoaded are NEVER persisted
                }),
            }
        ),
        { name: "AuthStore" }
    )
);

// ============================================
// GRANULAR SELECTORS
// ============================================

/** All roles the user holds in the current org. */
export const useUserRoles = () =>
    useAuthStore((s) => s.roles);

/** True if the user holds the given role in the current org. */
export const useIsPrimaryRole = (role: UserRole) =>
    useAuthStore((s) => s.roles.includes(role));
