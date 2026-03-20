/**
 * lib/query/keys/billing.keys.ts
 *
 * TanStack Query key factory for the billing domain.
 */

export const billingKeys = {
    /** Root key for all billing queries in an org. */
    all: (orgId: string) => ["billing", orgId] as const,

    /** Key for the org's invoice list. */
    invoices: (orgId: string) => [...billingKeys.all(orgId), "invoices"] as const,

    /** Key for the Stripe billing portal session. */
    portal: (orgId: string) => [...billingKeys.all(orgId), "portal"] as const,
};
