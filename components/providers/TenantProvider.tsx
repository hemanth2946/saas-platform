
"use client";

import { createContext, useContext, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import type { OrgContext } from "@/types";

// ============================================
// CONTEXT
// ============================================

type TenantContextValue = {
    org: OrgContext | null;
};

const TenantContext = createContext<TenantContextValue>({ org: null });

// ============================================
// PROVIDER
// ============================================

/**
 * TenantProvider — wraps all /[orgId]/* pages
 * Injects current org into React context
 * Syncs URL orgId with Zustand auth store
 *
 * @param orgId - The orgId from the URL segment
 * @param children - Child components
 *
 * @example
 * // In app/[orgId]/layout.tsx
 * <TenantProvider orgId={params.orgId}>
 *   {children}
 * </TenantProvider>
 */
export function TenantProvider({
    orgId,
    children,
}: {
    orgId: string;
    children: React.ReactNode;
}) {
    const org = useAuthStore((state) => state.org);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    useEffect(() => {
        // Log warning if URL orgId doesn't match stored org
        // proxy.ts should handle redirect — this is a safety check
        if (isAuthenticated && org && org.id !== orgId && org.slug !== orgId) {
            console.warn(
                `[TenantProvider] URL orgId "${orgId}" does not match stored org "${org.id}"`
            );
        }
    }, [orgId, org, isAuthenticated]);

    return (
        <TenantContext.Provider value={{ org }}>
            {children}
        </TenantContext.Provider>
    );
}

// ============================================
// HOOK
// ============================================

/**
 * Hook to access current tenant org from context
 * Must be used inside a TenantProvider
 *
 * @returns Current org context
 * @throws {Error} If used outside TenantProvider
 *
 * @example
 * const { org } = useTenant()
 * console.log(org?.name)
 */
export function useTenant(): TenantContextValue {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error("useTenant must be used within a TenantProvider");
    }
    return context;
}