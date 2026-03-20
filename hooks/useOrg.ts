"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { orgApi } from "@/lib/api";
import { orgKeys } from "@/lib/query/keys/org.keys";
import { useAuthStore } from "@/store/auth.store";
import type { OrgContext } from "@/types";

/**
 * TanStack Query hook for fetching the current org's live data.
 *
 * Architecture:
 *  - TanStack Query owns server state — query result is the source of truth
 *  - Components must read org data from the returned query object directly
 *  - Zustand is only written if the live plan differs from the session plan
 *  - No other Zustand fields are touched — name, slug, timezone all come
 *    from the query result, never from a Zustand sync
 *
 * @param orgId - The org's database ID (useAuthStore().org.id — always a cuid)
 */
export function useOrg(orgId: string | null | undefined) {
    const currentPlan = useAuthStore((s) => s.plan);
    const setPlan = useAuthStore((s) => s.setPlan);

    const query = useQuery<OrgContext>({
        queryKey: orgKeys.detail(orgId ?? ""),
        queryFn: async () => {
            const response = await orgApi.getOrg(orgId!);
            // Throw on API-level failure so TanStack Query enters error state.
            // The response interceptor already handles HTTP errors (401, 403, 500)
            // via Promise.reject — this guards against success:false on HTTP 200.
            if (!response.success) {
                throw new Error(response.message);
            }
            return response.data;
        },
        enabled: !!orgId,
        staleTime: 5 * 60 * 1000, // 5 min — org data changes infrequently
    });

    // Sync plan to Zustand ONLY when the live plan differs from session plan.
    // Keeps usePlanGate() correct after an upgrade or downgrade without
    // overwriting any other Zustand session state on every background refetch.
    useEffect(() => {
        if (query.data && query.data.plan !== currentPlan) {
            setPlan(query.data.plan);
        }
    }, [query.data, currentPlan, setPlan]);

    return query;
}
