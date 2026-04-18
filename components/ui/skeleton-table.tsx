"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SkeletonTableProps {
    rows?:      number;
    columns?:   number;
    className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * SkeletonTable
 *
 * Loading placeholder for tabular data.
 * Renders N full-width skeleton rows sized to --table-row-height.
 *
 * @example
 * <SkeletonTable rows={8} />
 */
export function SkeletonTable({ rows = 5, className }: SkeletonTableProps) {
    return (
        <div
            className={cn("space-y-2", className)}
            aria-busy="true"
            aria-label="Loading table data"
        >
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton
                    key={i}
                    className="h-[var(--table-row-height,3rem)] w-full rounded-lg"
                />
            ))}
        </div>
    );
}
