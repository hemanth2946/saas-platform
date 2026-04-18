"use client";

import { cn } from "@/lib/utils";
import { typography, spacing } from "@/lib/ui";
import { useUsers } from "@/hooks/useIAM";
import { useAuthStore } from "@/store/auth.store";

/**
 * SeatQuotaBar
 *
 * Displays a progress bar showing how many seats are used.
 * Hidden when seatLimit is null (unlimited plan).
 * Color shifts: green < 70%, amber 70–90%, red > 90%.
 */
export function SeatQuotaBar() {
    const { seatUsed, seatLimit } = useUsers();
    const orgSlug = useAuthStore((s) => s.org?.slug ?? "");

    // Hidden on unlimited plans
    if (seatLimit === null) return null;

    const percentage = seatLimit > 0 ? Math.min(100, (seatUsed / seatLimit) * 100) : 0;
    const isAtLimit  = seatUsed >= seatLimit;

    const barColor =
        percentage > 90 ? "bg-[var(--color-status-error-text)]"
        : percentage > 70 ? "bg-[var(--color-status-warning-text)]"
        : "bg-[var(--color-status-success-text)]";

    return (
        <div className={cn("flex flex-col", spacing.gapSm)}>
            <div className="flex items-center justify-between">
                <span className={typography.body.muted}>
                    {seatUsed} of {seatLimit} seats used
                </span>
                {isAtLimit && (
                    <a
                        href={`/${orgSlug}/billing`}
                        className={typography.ui.linkSm}
                    >
                        Upgrade &rarr;
                    </a>
                )}
            </div>

            <div
                role="progressbar"
                aria-valuenow={seatUsed}
                aria-valuemin={0}
                aria-valuemax={seatLimit}
                aria-label={`${seatUsed} of ${seatLimit} seats used`}
                className="h-2 w-full rounded-full bg-[var(--color-surface-secondary)] overflow-hidden"
            >
                <div
                    className={cn("h-full rounded-full transition-all duration-300", barColor)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
