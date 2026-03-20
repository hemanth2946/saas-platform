/**
 * Dashboard loading skeleton — app/[orgId]/dashboard/loading.tsx
 * Shown automatically by Next.js while the dashboard page is loading
 * and while Zustand is rehydrating from localStorage on first render.
 * Prevents blank/broken UI during the hydration gap.
 */
export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-gray-50 p-8 animate-pulse">
            <div className="max-w-2xl mx-auto">
                {/* Welcome heading skeleton */}
                <div className="h-8 w-64 bg-gray-200 rounded-md mb-3" />
                {/* Org name skeleton */}
                <div className="h-4 w-48 bg-gray-200 rounded-md mb-6" />

                {/* Card skeleton */}
                <div className="bg-white rounded-xl border p-6 space-y-3">
                    <div className="h-4 w-full bg-gray-200 rounded-md" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded-md" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded-md" />
                </div>

                {/* Plan gate skeleton */}
                <div className="mt-6 bg-white rounded-xl border p-6 space-y-3">
                    <div className="h-5 w-40 bg-gray-200 rounded-md mb-4" />
                    <div className="h-10 w-36 bg-gray-200 rounded-lg" />
                </div>

                {/* Permission gate skeleton */}
                <div className="mt-4 bg-white rounded-xl border p-6">
                    <div className="h-4 w-56 bg-gray-200 rounded-md" />
                </div>
            </div>
        </div>
    );
}
