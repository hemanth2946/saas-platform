import { TenantProvider } from "@/components/providers/TenantProvider";
import { PermissionsLoader } from "@/components/providers/PermissionsLoader";

/**
 * Layout for all /[orgId]/* routes.
 *
 * Phase 2 additions:
 * - Wraps children with TenantProvider (org context)
 * - Wraps children with PermissionsLoader:
 *   - Fetches GET /api/auth/permissions on mount (or when org changes)
 *   - Shows full-page skeleton while loading
 *   - Shows full-page error state with Retry button on failure
 *   - Children do NOT render until permissionsLoaded = true
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
                {children}
            </PermissionsLoader>
        </TenantProvider>
    );
}
