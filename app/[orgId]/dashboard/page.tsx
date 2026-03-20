"use client";

import { useEffect, useState } from "react";
import { useAuth, usePermission } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import { usePlanGate } from "@/hooks/usePlanGate";
import DashboardLoading from "./loading";

/**
 * Dashboard page — app/[orgId]/dashboard/page.tsx
 * Route: /[orgId]/dashboard
 * Protected by proxy.ts — only authenticated users reach here.
 */
export default function DashboardPage() {
    // ── Zustand hydration guard ──────────────────────────────────────────
    // Zustand persist reads from localStorage which is unavailable on the
    // server. On first client render the store hasn't rehydrated yet.
    // Wait one tick before rendering to avoid broken null reads.
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    if (!hydrated) {
        return <DashboardLoading />;
    }

    return <DashboardContent />;
}

/**
 * Rendered only after Zustand has rehydrated from localStorage.
 * Fetches live org data via TanStack Query — reads org from query result,
 * not from Zustand. Zustand is session state; query result is server state.
 */
function DashboardContent() {
    const { user, org: sessionOrg } = useAuth();

    // TanStack Query — fetches live org data from /api/orgs/[orgId]
    // sessionOrg.id is the database cuid, always available after hydration
    const { data: org, isLoading: orgLoading, isError: orgError } = useOrg(
        sessionOrg?.id
    );

    // Plan gate: reads from Zustand plan field (kept in sync by useOrg)
    const { allowed: canUseAI, requiredPlan } = usePlanGate("pro");

    // Permission gate: reads from Zustand user.permissions
    const canInvite = usePermission("iam.invite");

    // Show skeleton while TanStack Query fetches org on first load
    // and sessionOrg is not yet available
    if (orgLoading && !org) {
        return <DashboardLoading />;
    }

    // Degrade gracefully on fetch error — show cached session data if available
    const displayOrg = org ?? sessionOrg;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {user?.name ? `Welcome, ${user.name}` : "Welcome"}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {displayOrg?.name ?? "Loading organisation..."}
                    </p>
                </div>

                {/* Org fetch error — non-fatal, session data still shown */}
                {orgError && (
                    <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">
                        <p className="text-sm text-yellow-800">
                            Could not refresh organisation data. Showing cached info.
                        </p>
                    </div>
                )}

                {/* Status card */}
                <div className="bg-white rounded-xl border p-6">
                    <p className="text-sm text-gray-500">
                        Auth is working correctly. Dashboard coming in Phase 2.
                    </p>
                    <dl className="mt-4 space-y-1 text-sm">
                        <div className="flex gap-2">
                            <dt className="text-gray-400 w-24">Role</dt>
                            <dd className="text-gray-700 font-medium">
                                {user?.role ?? "—"}
                            </dd>
                        </div>
                        <div className="flex gap-2">
                            <dt className="text-gray-400 w-24">Plan</dt>
                            <dd className="text-gray-700 font-medium capitalize">
                                {displayOrg?.plan ?? "—"}
                            </dd>
                        </div>
                        <div className="flex gap-2">
                            <dt className="text-gray-400 w-24">Timezone</dt>
                            <dd className="text-gray-700 font-medium">
                                {displayOrg?.timezone ?? "—"}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Plan-gated feature — AI Assistant requires Pro+ */}
                <div className="bg-white rounded-xl border p-6">
                    <h2 className="text-sm font-medium text-gray-900 mb-4">
                        AI Assistant (Pro+)
                    </h2>
                    {canUseAI ? (
                        <button className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors">
                            Open AI Assistant
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                                Upgrade to{" "}
                                <span className="font-medium capitalize">
                                    {requiredPlan}
                                </span>{" "}
                                to unlock AI Assistant.
                            </span>
                            <button className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">
                                Upgrade
                            </button>
                        </div>
                    )}
                </div>

                {/* Permission-gated element — visible to iam.invite only */}
                {canInvite && (
                    <div className="bg-white rounded-xl border p-6">
                        <h2 className="text-sm font-medium text-gray-900 mb-4">
                            Team Management
                        </h2>
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Invite team member
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
