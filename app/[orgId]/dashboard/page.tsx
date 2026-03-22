"use client";

import { useAuth } from "@/hooks/useAuth";
import { PlanGate } from "@/components/plan/PlanGate";
import { UpgradePrompt } from "@/components/plan/UpgradePrompt";
import { BetaScannerBanner } from "@/components/flags/BetaScannerBanner";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { FEATURE_FLAG_KEYS } from "@/config/featureFlags";
import { usePlanGate } from "@/hooks/usePlanGate";

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
// PLACEHOLDER — AI Suggestions Panel
// Shown only when BOTH the plan allows AND the flag is enabled.
// Phase 5 will implement the actual AI suggestions feature.
// ============================================

function AISuggestionsPanel() {
    return (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p className="text-sm font-medium text-gray-600">AI Suggestions Panel</p>
            <p className="mt-1 text-xs text-gray-400">
                Coming soon — AI-powered recommendations for your security data.
            </p>
        </div>
    );
}

// ============================================
// DASHBOARD PAGE
// ============================================

/**
 * Dashboard page
 * Route: /[orgId]/dashboard
 *
 * Phase 2C: wires feature flags end-to-end alongside plan gating.
 *
 * Demonstrates the correct separation:
 *   Plan gate  → billing control ("Are you on the right plan?")
 *   Feature flag → rollout control ("Is this feature turned ON for your org?")
 *
 * They combine with &&, never replace each other:
 *   if (planAllowed && flagEnabled) → show feature
 *   if (!planAllowed) → show UpgradePrompt (regardless of flag)
 *   if (planAllowed && !flagEnabled) → show nothing (coming soon, not promoted)
 */
export default function DashboardPage() {
    const { user, org } = useAuth();

    // Feature flag reads — synchronous, pure store reads
    const { enabled: betaScannerEnabled }   = useFeatureFlag(FEATURE_FLAG_KEYS.BETA_SCANNER);
    const { enabled: aiSuggestionsEnabled } = useFeatureFlag(FEATURE_FLAG_KEYS.AI_SUGGESTIONS);

    // Plan gate for AI suggestions — controls billing access
    const { allowed: aiChatAllowed }        = usePlanGate("ai.chat");

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                        Welcome, {user?.name}
                    </h1>
                    <p className="text-gray-500">Organisation: {org?.name}</p>
                </div>

                {/* Phase 2C: Beta Scanner feature flag end-to-end example
                    beta-scanner flag is seeded as enabled: true for acme/globex orgs.
                    Dismissable via local state — no persistence needed. */}
                {betaScannerEnabled && <BetaScannerBanner />}

                {/* Phase 2B: Plan-gated AI Assistant
                    Free org  → AI chat shows UpgradePrompt
                    Pro/Growth org → AI chat shows AIChatButton */}
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

                {/* Phase 2C: Combined plan gate + feature flag example
                    Demonstrates correct separation of billing vs rollout.
                    - !aiChatAllowed → wrong plan → show UpgradePrompt
                    - aiChatAllowed && aiSuggestionsEnabled → both pass → show panel
                    - aiChatAllowed && !aiSuggestionsEnabled → plan OK but flag off → show nothing
                      (feature coming soon — not promoted until flag is enabled) */}
                <div className="bg-white rounded-xl border p-6 space-y-3">
                    <h2 className="text-sm font-semibold text-gray-700">AI Suggestions</h2>

                    {!aiChatAllowed && (
                        <UpgradePrompt
                            feature="AI Suggestions"
                            requiredPlan="pro"
                            description="Upgrade to Pro to unlock AI-powered suggestions for your security findings."
                        />
                    )}

                    {aiChatAllowed && aiSuggestionsEnabled && <AISuggestionsPanel />}

                    {aiChatAllowed && !aiSuggestionsEnabled && (
                        <p className="text-sm text-gray-400">
                            AI Suggestions coming soon for your organisation.
                        </p>
                    )}
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
