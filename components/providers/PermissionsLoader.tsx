"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { authApi } from "@/lib/api/resources/auth.api";
import { authKeys } from "@/lib/query/keys/auth.keys";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================
// LOADING SKELETON
// Approximates sidebar + content layout to avoid layout shift
// ============================================

function PermissionsLoadingSkeleton() {
    return (
        <div
            className="min-h-screen bg-gray-50 flex"
            aria-busy="true"
            aria-label="Loading your workspace"
        >
            {/* Sidebar skeleton */}
            <aside className="w-60 bg-white border-r flex-shrink-0 p-4 space-y-3">
                <Skeleton className="h-8 w-32 mb-6" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full rounded-lg" />
                ))}
                <div className="absolute bottom-4 left-4 w-52">
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
            </aside>

            {/* Main content skeleton */}
            <main className="flex-1 p-8 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-40" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                </div>
                <Skeleton className="h-64 rounded-xl mt-4" />
            </main>
        </div>
    );
}

// ============================================
// ERROR STATE
// ============================================

function PermissionsErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <div
            className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
            role="alert"
            aria-live="assertive"
        >
            <div className="max-w-md w-full bg-white rounded-2xl border p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                    <svg
                        className="w-6 h-6 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                        />
                    </svg>
                </div>

                <h2 className="text-lg font-semibold text-gray-900">
                    Unable to load permissions
                </h2>

                <p className="text-sm text-gray-500">
                    Failed to load your access permissions. Please refresh or
                    contact support.
                </p>

                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-2 inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 transition-colors"
                >
                    Retry
                </button>
            </div>
        </div>
    );
}

// ============================================
// PERMISSIONS LOADER
// ============================================

type PermissionsLoaderProps = {
    orgId: string;
    children: React.ReactNode;
};

/**
 * Client component that fetches and syncs permissions for the current org.
 *
 * Behaviour:
 * - If permissionsLoaded is already true → skip fetch, render children
 * - While fetching → render PermissionsLoadingSkeleton (no children)
 * - On success → sync to Zustand via setPermissions → render children
 * - On failure (after 2 retries) → render PermissionsErrorState with Retry
 *
 * Use inside TenantProvider in app/[orgId]/layout.tsx.
 */
export function PermissionsLoader({ orgId, children }: PermissionsLoaderProps) {
    const permissionsLoaded = useAuthStore((state) => state.permissionsLoaded);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const setPermissions = useAuthStore((state) => state.setPermissions);

    const { data, isError, isLoading, refetch } = useQuery({
        queryKey: authKeys.permissions(orgId),
        queryFn: () => authApi.getPermissions().then((r) => r.data),
        enabled: isAuthenticated && !permissionsLoaded,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });

    // Sync fetched data into Zustand store
    useEffect(() => {
        if (data != null && !permissionsLoaded) {
            setPermissions(data.permissions, data.roles);
        }
    }, [data, permissionsLoaded, setPermissions]);

    // Show error state (after retries exhausted)
    if (isError && !permissionsLoaded) {
        return <PermissionsErrorState onRetry={() => void refetch()} />;
    }

    // Show skeleton until permissions are loaded
    if (!permissionsLoaded || isLoading) {
        return <PermissionsLoadingSkeleton />;
    }

    return <>{children}</>;
}
