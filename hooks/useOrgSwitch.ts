"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { selectOrgService } from "@/lib/services/auth.service";
import { authKeys } from "@/lib/query/keys/auth.keys";
import { toast } from "sonner";
import type { OrgContext } from "@/types";
import type { PlanConfig } from "@/types";

/**
 * Hook for switching between organisations.
 *
 * switchOrg(orgId) flow:
 * 1. Back up current org session (for rollback on failure)
 * 2. Clear org session (org, plan, permissions, role, permissionsLoaded)
 * 3. Call POST /api/auth/select-org { orgId }
 * 4. Store new org + plan in Zustand
 * 5. Invalidate TanStack Query permissions key → forces fresh fetch
 * 6. Redirect to /[newOrg.slug]/dashboard
 * 7. [orgId]/layout.tsx detects permissionsLoaded = false → fetches fresh
 * 8. On failure → restore previous session, show toast error
 *
 * @returns { switchOrg, isSwitching }
 *
 * @example
 * const { switchOrg, isSwitching } = useOrgSwitch()
 * await switchOrg("org_123")
 */
export function useOrgSwitch() {
    const [isSwitching, setIsSwitching] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();

    const clearOrgSession = useAuthStore((state) => state.clearOrgSession);
    const setOrgSession = useAuthStore((state) => state.setOrgSession);

    // Snapshot current session for rollback
    const currentOrg = useAuthStore((state) => state.org);
    const currentPlan = useAuthStore((state) => state.plan);

    async function switchOrg(orgId: string): Promise<void> {
        if (isSwitching) return;
        setIsSwitching(true);

        // Backup for rollback
        const backupOrg: OrgContext | null = currentOrg;
        const backupPlan: PlanConfig | null = currentPlan;

        // Clear current org session — permissionsLoaded becomes false
        clearOrgSession();

        try {
            const { slug } = await selectOrgService(orgId);

            // Invalidate permissions query so [orgId]/layout.tsx re-fetches
            await queryClient.invalidateQueries({
                queryKey: authKeys.permissions(orgId),
            });

            // Navigate to new org dashboard
            router.push(`/${slug}/dashboard`);
        } catch {
            // Rollback to previous org session
            if (backupOrg && backupPlan) {
                setOrgSession(backupOrg, backupPlan);
            }
            toast.error("Failed to switch organisation. Please try again.");
        } finally {
            setIsSwitching(false);
        }
    }

    return { switchOrg, isSwitching };
}
