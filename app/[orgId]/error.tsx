"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Org-level error boundary — app/[orgId]/error.tsx
 * Catches unhandled errors in any /[orgId]/* page.
 * Provides a recovery action scoped to the org context.
 */
export default function OrgError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        console.error("[OrgError]", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl border shadow-sm p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Page error
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    Something went wrong loading this page.
                </p>
                {error.digest && (
                    <p className="text-xs text-gray-400 font-mono mb-6">
                        Error ID: {error.digest}
                    </p>
                )}
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Try again
                    </button>
                    <button
                        onClick={() => router.push("/login")}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Back to login
                    </button>
                </div>
            </div>
        </div>
    );
}
