"use client";

import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { PlanTag } from "./PlanTag";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import type { PlanName, PlanTagVariant } from "@/types";

// ============================================
// TYPES
// ============================================

interface UpgradePromptProps {
    /** Human-readable feature name e.g. "Advanced Scanning" */
    feature?:     string;
    /** Minimum plan required to unlock this feature */
    requiredPlan: PlanName;
    /** Optional description override */
    description?: string;
    /** Compact mode: single line, for inline use next to nav items */
    compact?:     boolean;
    className?:   string;
}

// ============================================
// HELPERS
// ============================================

const PLAN_DESCRIPTIONS: Record<PlanName, string> = {
    free:   "",
    pro:    "Available on the Pro plan and above.",
    growth: "Available on the Growth plan only.",
};

function toPlanTagVariant(plan: PlanName): PlanTagVariant | null {
    if (plan === "pro" || plan === "growth") return plan;
    return null;
}

// ============================================
// COMPACT MODE
// ============================================

function CompactUpgradePrompt({
    feature,
    requiredPlan,
    orgId,
    className,
}: {
    feature?:     string;
    requiredPlan: PlanName;
    orgId:        string;
    className?:   string;
}) {
    const tagVariant = toPlanTagVariant(requiredPlan);

    return (
        <span className={cn("inline-flex items-center gap-1.5 text-sm text-muted-foreground", className)}>
            {tagVariant && <PlanTag variant={tagVariant} />}
            <Link
                href={`/${orgId}/billing`}
                className="text-xs underline underline-offset-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Upgrade to ${requiredPlan} to unlock${feature ? ` ${feature}` : ""}`}
            >
                Upgrade to unlock
            </Link>
        </span>
    );
}

// ============================================
// FULL MODE
// ============================================

function FullUpgradePrompt({
    feature,
    requiredPlan,
    description,
    orgId,
    className,
}: {
    feature?:     string;
    requiredPlan: PlanName;
    description?: string;
    orgId:        string;
    className?:   string;
}) {
    const tagVariant    = toPlanTagVariant(requiredPlan);
    const planLabel     = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);
    const descText      = description ?? PLAN_DESCRIPTIONS[requiredPlan] ?? `Available on the ${planLabel} plan and above.`;

    const ctaClass = requiredPlan === "growth"
        ? "bg-[#085041] text-white hover:bg-[#064033]"
        : "bg-[#3C3489] text-white hover:bg-[#2e2870]";

    return (
        <div className={cn("rounded-xl border border-muted bg-muted/30 p-6 space-y-4", className)}>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Lock size={16} className="text-muted-foreground" aria-hidden="true" />
                    </div>
                    {feature && (
                        <span className="text-sm font-semibold text-foreground">{feature}</span>
                    )}
                </div>
                {tagVariant && <PlanTag variant={tagVariant} />}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground">{descText}</p>

            {/* CTA */}
            <Link
                href={`/${orgId}/billing`}
                className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    ctaClass
                )}
                aria-label={`Upgrade to ${planLabel} to unlock${feature ? ` ${feature}` : ""}`}
            >
                Upgrade to {planLabel}
                <ArrowRight size={14} aria-hidden="true" />
            </Link>
        </div>
    );
}

// ============================================
// <UpgradePrompt> — public export
// ============================================

/**
 * Displays an upgrade CTA when a plan-gated feature is not available.
 *
 * Two modes:
 * - Full (default): Card with lock icon, description, and upgrade button
 * - Compact:        Single line with PlanTag + upgrade link
 *
 * @example
 * <UpgradePrompt feature="AI Assistant" requiredPlan="pro" />
 * <UpgradePrompt feature="AI Assistant" requiredPlan="pro" compact />
 */
export function UpgradePrompt({
    feature,
    requiredPlan,
    description,
    compact = false,
    className,
}: UpgradePromptProps) {
    const orgId = useAuthStore((s) => s.org?.slug ?? "");

    // Free plan has no upgrade path — render nothing
    if (requiredPlan === "free") return null;

    if (compact) {
        return (
            <CompactUpgradePrompt
                feature={feature}
                requiredPlan={requiredPlan}
                orgId={orgId}
                className={className}
            />
        );
    }

    return (
        <FullUpgradePrompt
            feature={feature}
            requiredPlan={requiredPlan}
            description={description}
            orgId={orgId}
            className={className}
        />
    );
}
