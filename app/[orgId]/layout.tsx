import { TenantProvider } from "@/components/providers/TenantProvider";
import { PermissionsLoader } from "@/components/providers/PermissionsLoader";
import { PlanProvider } from "@/components/providers/PlanProvider";
import { FlagsProvider } from "@/components/providers/FlagsProvider";
import { AppShell } from "@/components/layout";

/**
 * Layout for all /[orgId]/* routes.
 *
 * Provider nesting order (each blocks until ready before rendering the next):
 * 1. AppShell           — renders TopBar/Sidebar/BottomBar shell immediately
 * 2. TenantProvider     — syncs URL orgId with Zustand auth store
 * 3. PermissionsLoader  — fetches + syncs RBAC permissions; blocks until loaded
 * 4. PlanProvider       — fetches + syncs plan config (billing); blocks until loaded
 * 5. FlagsProvider      — fetches + syncs feature flags (rollout); blocks until loaded
 *
 * AppShell is OUTSIDE providers so the chrome renders during provider loading.
 * Every child component has permissions, plan config, AND feature flags
 * available synchronously from their respective Zustand stores.
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
        <AppShell>
            <TenantProvider orgId={orgId}>
                <PermissionsLoader orgId={orgId}>
                    <PlanProvider orgId={orgId}>
                        <FlagsProvider orgId={orgId}>
                            {children}
                        </FlagsProvider>
                    </PlanProvider>
                </PermissionsLoader>
            </TenantProvider>
        </AppShell>
    );
}
