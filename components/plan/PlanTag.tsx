"use client";

import { Lock } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { PlanTagVariant } from "@/types";

// ============================================
// CVA VARIANTS
// ============================================

const planTagVariants = cva(
    // Base: inline-flex container with relative positioning for the shine beam
    "relative inline-flex items-center gap-1 overflow-hidden rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none select-none",
    {
        variants: {
            variant: {
                pro: "bg-[#EEEDFE] text-[#3C3489] border-[#C4C0F8]",
                growth: "bg-[#E1F5EE] text-[#085041] border-[#A3D9C4]",
            },
        },
    }
);

// ============================================
// TYPES
// ============================================

interface PlanTagProps extends VariantProps<typeof planTagVariants> {
    variant:    PlanTagVariant;
    className?: string;
}

// ============================================
// LABEL MAP
// ============================================

const PLAN_LABELS: Record<PlanTagVariant, string> = {
    pro:    "Pro",
    growth: "Growth",
};

// Shine animation duration per variant (matches globals.css keyframe classes)
const SHINE_CLASS: Record<PlanTagVariant, string> = {
    pro:    "animate-plan-shine-pro",
    growth: "animate-plan-shine-growth",
};

// ============================================
// <PlanTag>
// ============================================

/**
 * Inline upgrade badge shown next to plan-gated features.
 * Free plan → returns null (Free is the baseline; no tag shown).
 *
 * Features a left-to-right shine beam animation defined in globals.css.
 *
 * @example
 * <PlanTag variant="pro" />    // Purple badge
 * <PlanTag variant="growth" /> // Green badge
 */
export function PlanTag({ variant, className }: PlanTagProps) {
    // Free has no tag — it is the baseline
    if (!variant || !(variant in PLAN_LABELS)) return null;

    const label      = PLAN_LABELS[variant];
    const shineClass = SHINE_CLASS[variant];

    return (
        <span
            className={cn(planTagVariants({ variant }), className)}
            aria-label={`Requires ${label} plan`}
        >
            {/* Shine beam — purely decorative, no pointer events */}
            <span
                className={cn(
                    "absolute top-0 h-full w-12 -skew-x-12 bg-white/40 pointer-events-none",
                    shineClass
                )}
                aria-hidden="true"
            />

            <Lock size={10} aria-hidden="true" />
            <span>{label}</span>
        </span>
    );
}
