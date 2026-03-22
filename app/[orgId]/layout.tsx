import { TenantProvider } from "@/components/providers/TenantProvider";
import { PermissionsLoader } from "@/components/providers/PermissionsLoader";
import { PlanProvider } from "@/components/providers/PlanProvider";
import { FlagsProvider } from "@/components/providers/FlagsProvider";

/**
 * Layout for all /[orgId]/* routes.
 *
 * Provider nesting order (each blocks until ready before rendering the next):
 * 1. TenantProvider     — syncs URL orgId with Zustand auth store
 * 2. PermissionsLoader  — fetches + syncs RBAC permissions; blocks until loaded
 * 3. PlanProvider       — fetches + syncs plan config (billing); blocks until loaded
 * 4. FlagsProvider      — fetches + syncs feature flags (rollout); blocks until loaded
 *
 * Every child component has permissions, plan config, AND feature flags
 * available synchronously from their respective Zustand stores.
 *
 * Render order ensures:
 *   1. Who are you (RBAC)
 *   2. What plan are you on (billing)
 *   3. What features are turned on for your org (rollout)
 *   4. Children render with ALL three available
 */
export default async function OrgLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ orgId: string }>;
}) {
    const { orgId } = await params;

    return (
        <TenantProvider orgId={orgId}>
            <PermissionsLoader orgId={orgId}>
                <PlanProvider orgId={orgId}>
                    <FlagsProvider orgId={orgId}>
                        {children}
                    </FlagsProvider>
                </PlanProvider>
            </PermissionsLoader>
        </TenantProvider>
    );
}
