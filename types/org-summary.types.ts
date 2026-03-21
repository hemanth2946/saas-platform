// ============================================
// ORG SUMMARY TYPE
// Lightweight org shape returned at login time.
// Used on the /select-org page to list all orgs
// the user belongs to — before one is selected.
// ============================================

export type OrgSummary = {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    plan: string;        // plan name: "free" | "pro" | "growth" | "enterprise"
    role: string;        // user's role in this org: "super_admin" | "admin" | "member" | "viewer"
    memberCount: number; // total active members in this org
};
