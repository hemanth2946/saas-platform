"use client";

import { useEffect } from "react";

/**
 * Root error boundary — app/error.tsx
 * Catches any unhandled React error in the root layout subtree.
 * Prevents the entire app from showing a white screen on unexpected errors.
 *
 * Next.js 16 automatically wraps this around the root layout children.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to console in dev; swap for an error reporting service in prod
        console.error("[GlobalError]", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl border shadow-sm p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Something went wrong
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    An unexpected error occurred. Our team has been notified.
                </p>
                {error.digest && (
                    <p className="text-xs text-gray-400 font-mono mb-6">
                        Error ID: {error.digest}
                    </p>
                )}
                <button
                    onClick={reset}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
