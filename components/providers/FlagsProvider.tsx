"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useFeatureFlagsStore } from "@/store/feature-flags.store";
import { getFeatureFlags } from "@/lib/api/flags.service";
import { featureFlagKeys } from "@/lib/query/keys/featureFlags.keys";
import { logger } from "@/lib/api/core/logger";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================
// LOADING SKELETON
// Matches sidebar + content layout — zero layout shift
// ============================================

function FlagsLoadingSkeleton() {
    return (
        <div
            className="min-h-screen bg-gray-50 flex"
            aria-busy="true"
            aria-label="Loading feature configuration"
        >
            {/* Sidebar skeleton */}
            <aside className="w-60 bg-white border-r flex-shrink-0 p-4 space-y-3">
                <Skeleton className="h-8 w-32 mb-6" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full rounded-lg" />
                ))}
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

function FlagsErrorState({ onRetry }: { onRetry: () => void }) {
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
                    Unable to load feature configuration
                </h2>

                <p className="text-sm text-gray-500">
                    Failed to load feature flags. Please refresh or contact support.
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
// DEV FALLBACK BADGE
// Visible only in development when static fallback is active
// ============================================

function FlagsFallbackBadge() {
    if (process.env.NODE_ENV !== "development") return null;

    return (
        <div
            className="fixed bottom-12 left-4 z-50 bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full border border-amber-200"
            aria-hidden="true"
        >
            Using offline feature flags
        </div>
    );
}

// ============================================
// FLAGS PROVIDER
// ============================================

type FlagsProviderProps = {
    orgId:    string;
    children: React.ReactNode;
};

/**
 * Fetches and syncs feature flags for the current org.
 * Follows the exact same pattern as PlanProvider.
 *
 * Behaviour:
 * - Fetch GET /api/v1/flags/:orgId via TanStack Query
 * - On success → call setFeatureFlags → render children
 * - On API failure → call setFeatureFlagsFallback (all flags disabled) → render children
 * - While loading → render FlagsLoadingSkeleton
 * - On unrecoverable error AND fallback also failed → render FlagsErrorState
 * - Children do NOT render until isLoaded = true
 *
 * Position in layout: after PlanProvider, before children.
 * Layout order: PermissionsLoader → PlanProvider → FlagsProvider → children
 */
export function FlagsProvider({ orgId, children }: FlagsProviderProps) {
    const queryClient = useQueryClient();

    const org             = useAuthStore((state) => state.org);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    // Use the org's DB id for the API call — the JWT contains the DB id, not the slug.
    const orgDbId = org?.id ?? null;

    const isLoaded              = useFeatureFlagsStore((s) => s.isLoaded);
    const isFallback            = useFeatureFlagsStore((s) => s.isFallback);
    const setFeatureFlags       = useFeatureFlagsStore((s) => s.setFeatureFlags);
    const setFeatureFlagsFallback = useFeatureFlagsStore((s) => s.setFeatureFlagsFallback);

    const { data, isError, isLoading, refetch } = useQuery({
        queryKey:  featureFlagKeys.all(orgId),
        queryFn:   () => getFeatureFlags(),
        // Wait until org is hydrated from Zustand so we have the DB id
        enabled:   isAuthenticated && !isLoaded && orgDbId !== null,
        staleTime: 5 * 60 * 1000, // 5 minutes — flags can change but not constantly
        retry:     2,
        refetchOnWindowFocus: false,
    });

    // On org change, invalidate flags cache so it re-fetches for the new org
    useEffect(() => {
        return () => {
            void queryClient.invalidateQueries({ queryKey: featureFlagKeys.all(orgId) });
        };
    }, [orgId, queryClient]);

    // Also invalidate when the DB id changes (e.g. after org switch completes)
    useEffect(() => {
        if (!orgDbId) return;
        return () => {
            void queryClient.invalidateQueries({ queryKey: featureFlagKeys.all(orgId) });
        };
    }, [orgDbId, orgId, queryClient]);

    // Sync fetched flags into Zustand store
    useEffect(() => {
        if (data && !isLoaded) {
            setFeatureFlags(data);
        }
    }, [data, isLoaded, setFeatureFlags]);

    // On API failure: use static fallback (all flags disabled) so the UI never breaks
    useEffect(() => {
        if (isError && !isLoaded) {
            logger.warn("[FlagsProvider] Flags API failed — using static fallback (all disabled)", {
                orgId,
            });
            setFeatureFlagsFallback();
        }
    }, [isError, isLoaded, orgId, setFeatureFlagsFallback]);

    // Show error state only when API failed AND static fallback also failed (should not happen)
    if (isError && !isLoaded) {
        return <FlagsErrorState onRetry={() => void refetch()} />;
    }

    // Show skeleton until flags are loaded
    if (!isLoaded || isLoading) {
        return <FlagsLoadingSkeleton />;
    }

    return (
        <>
            {children}
            {isFallback && <FlagsFallbackBadge />}
        </>
    );
}
