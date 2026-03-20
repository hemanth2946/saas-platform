import { TenantProvider } from "@/components/providers/TenantProvider";

/**
 * Layout for all /[orgId]/* routes
 * Wraps every org page with TenantProvider
 * proxy.ts ensures only authenticated users reach here
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
            {children}
        </TenantProvider>
    );
}