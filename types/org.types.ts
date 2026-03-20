// ============================================
// ORG TYPES
// Shape of the current organization in context
// Injected by TenantProvider into every page
// ============================================

import type { Plan } from "./Plan.types";

export type OrgContext = {
    id: string;
    name: string;
    slug: string;           // used in URL: /[slug]/dashboard
    logo?: string | null;
    domain?: string | null;
    timezone: string;
    plan: Plan;
    createdAt: string;
};

export type OrgSettings = {
    name: string;
    logo?: string | null;
    domain?: string | null;
    timezone: string;
};