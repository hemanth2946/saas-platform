"use client";

import { useAuth } from "@/hooks/useAuth";

/**
 * Dashboard page — placeholder
 * Route: /[orgId]/dashboard
 * Protected by proxy.ts — only authenticated users reach here
 * Full dashboard built in Phase 2
 */
export default function DashboardPage() {
    const { user, org } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                    Welcome, {user?.name} 👋
                </h1>
                <p className="text-gray-500 mb-6">
                    Organisation: {org?.name}
                </p>
                <div className="bg-white rounded-xl border p-6">
                    <p className="text-sm text-gray-500">
                        Dashboard coming in Phase 2.
                        Auth is working correctly ✅
                    </p>
                </div>
            </div>
        </div>
    );
}