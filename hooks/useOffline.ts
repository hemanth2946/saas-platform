"use client";

import { useEffect, useState } from "react";

/**
 * Returns true when the browser reports it has lost network connectivity.
 *
 * SSR-safe — defaults to false (online) on the server where
 * navigator is not available. Corrects to the real browser state
 * on first client render via useEffect.
 *
 * Distinct from HealthPoller which checks if the *server* is reachable.
 * This hook checks if the *browser* has network connectivity at all.
 *
 * @example
 * const isOffline = useOffline()
 * if (isOffline) return <OfflineBanner />
 */
export function useOffline(): boolean {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        // Sync with real browser state on mount —
        // useState(false) is the safe SSR default but may be wrong on client
        setIsOffline(!navigator.onLine);

        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);

        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, []);

    return isOffline;
}
