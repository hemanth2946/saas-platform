"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { typography } from "@/lib/ui";
import { roleVariants } from "@/features/iam/constants/iam.variants";
import type { RoleRecord } from "@/types";

interface RoleChipProps {
    role:     RoleRecord;
    onRemove: () => void;
}

/**
 * RoleChip
 *
 * Displays a selected role as a removable chip.
 * Quick roles use roleVariants colors; service-based roles use a neutral style.
 */
export function RoleChip({ role, onRemove }: RoleChipProps) {
    const isQuick   = role.type === "QUICK";
    const quickName = role.name as keyof typeof roleVariants;
    const chipClass = isQuick && roleVariants[quickName]
        ? roleVariants[quickName].className
        : "bg-[var(--color-status-info-surface)] text-[var(--color-status-info-text)] border border-[var(--color-status-info-border)]";

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                chipClass
            )}
        >
            <span className={typography.label.sm}>
                {role.name}
            </span>
            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${role.name} role`}
                className={cn(
                    "min-h-[var(--min-touch-target)] min-w-[var(--min-touch-target)]",
                    "-mr-1 flex items-center justify-center rounded-full opacity-70",
                    "hover:opacity-100 focus-visible:outline-none focus-visible:ring-1",
                    "focus-visible:ring-current transition-opacity"
                )}
            >
                <X size={10} aria-hidden="true" />
            </button>
        </span>
    );
}
