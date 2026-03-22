"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

/**
 * BetaScannerBanner
 *
 * Shown when the "beta-scanner" feature flag is enabled for the org.
 * Dismissable via local state — no persistence needed at this stage.
 *
 * Phase 2C end-to-end example: flag-controlled UI component.
 */
export function BetaScannerBanner() {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
        >
            <div className="flex items-start gap-3 min-w-0">
                <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"
                    />
                </svg>

                <p className="text-sm text-blue-900">
                    <span className="font-medium">Beta Scanner is active for your organisation.</span>
                    {" "}Advanced detection capabilities are enabled.
                    <Badge
                        className="ml-2 bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-semibold uppercase tracking-wide hover:bg-amber-100"
                        variant="outline"
                    >
                        BETA
                    </Badge>
                </p>
            </div>

            <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss beta scanner notice"
                className="flex-shrink-0 rounded p-0.5 text-blue-600 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 transition-colors"
            >
                <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>
    );
}
