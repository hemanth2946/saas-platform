"use client";

import { useOffline } from "@/hooks/useOffline";

/**
 * OfflineBanner — fixed top banner shown when the browser loses connectivity.
 *
 * Renders nothing when online — zero layout impact.
 * Auto-shows when the browser fires the "offline" event.
 * Auto-hides when the browser fires the "online" event.
 *
 * Placed in the root layout inside QueryProvider so it is present
 * on every page without each page needing to mount it separately.
 */
export function OfflineBanner() {
    const isOffline = useOffline();

    if (!isOffline) return null;

    return (
        <div
            role="alert"
            aria-live="assertive"
            className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-yellow-950 text-center text-sm font-medium py-2 px-4"
        >
            You&apos;re offline — some features may be unavailable.
        </div>
    );
}
