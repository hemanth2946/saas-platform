"use client";

import { useAuth } from "@/hooks/useAuth";
import { PlanGate } from "@/components/plan/PlanGate";
import { UpgradePrompt } from "@/components/plan/UpgradePrompt";

// ============================================
// PLACEHOLDER — AI Chat Button
// Phase 5 will implement the actual AI feature.
// ============================================

function AIChatButton() {
    return (
        <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-[#3C3489] px-4 py-2 text-sm font-medium text-white hover:bg-[#2e2870] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C3489] focus-visible:ring-offset-2 transition-colors"
        >
            Open AI Assistant
        </button>
    );
}

// ============================================
// DASHBOARD PAGE
// ============================================

/**
 * Dashboard page
 * Route: /[orgId]/dashboard
 *
 * Phase 2B: wires plan gating end-to-end.
 * - Free org  → AI chat shows UpgradePrompt
 * - Pro/Growth org → AI chat shows AIChatButton
 */
export default function DashboardPage() {
    const { user, org } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                        Welcome, {user?.name}
                    </h1>
                    <p className="text-gray-500">Organisation: {org?.name}</p>
                </div>

                {/* Plan-gated AI Assistant — Phase 2B end-to-end example */}
                <div className="bg-white rounded-xl border p-6 space-y-3">
                    <h2 className="text-sm font-semibold text-gray-700">AI Assistant</h2>

                    <PlanGate
                        feature="ai.chat"
                        fallback={
                            <UpgradePrompt
                                feature="AI Assistant"
                                requiredPlan="pro"
                                description="Get AI-powered insights about your security data. Available on the Pro plan and above."
                            />
                        }
                    >
                        <AIChatButton />
                    </PlanGate>
                </div>

                <div className="bg-white rounded-xl border p-6">
                    <p className="text-sm text-gray-500">
                        Full dashboard coming in a future phase.
                    </p>
                </div>
            </div>
        </div>
    );
}
