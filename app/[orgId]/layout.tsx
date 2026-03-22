import { TenantProvider } from "@/components/providers/TenantProvider";
import { PermissionsLoader } from "@/components/providers/PermissionsLoader";
import { PlanProvider } from "@/components/providers/PlanProvider";

/**
 * Layout for all /[orgId]/* routes.
 *
 * Provider nesting order (each blocks until ready before rendering the next):
 * 1. TenantProvider     — syncs URL orgId with Zustand auth store
 * 2. PermissionsLoader  — fetches + syncs RBAC permissions; blocks until loaded
 * 3. PlanProvider       — fetches + syncs plan config; blocks until loaded
 *
 * Every child component has both permissions AND plan config available
 * synchronously from their respective Zustand stores.
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
                    {children}
                </PlanProvider>
            </PermissionsLoader>
        </TenantProvider>
    );
}
