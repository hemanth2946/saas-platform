/**
 * components/providers/HealthPoller.tsx
 *
 * Client component that starts health polling on mount.
 * Renders nothing — purely a side-effect component.
 * Placed in the root layout so polling runs across the entire app.
 */

"use client";

import { useEffect } from "react";
import { startHealthPolling } from "@/lib/api/clients/health.client";

export function HealthPoller(): null {
    useEffect(() => {
        const stop = startHealthPolling(30_000);
        return stop;
    }, []);

    return null;
}
