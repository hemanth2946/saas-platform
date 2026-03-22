import {
    LayoutDashboard,
    Users,
    CreditCard,
    Settings,
    ClipboardList,
    Bot,
    ScanSearch,
    type LucideIcon,
} from "lucide-react";
import type { Permission, PlanName } from "@/types";

// ============================================
// NAV ITEM TYPE
// ============================================

export type NavItem = {
    label:      string;
    /** Route segment relative to /[orgId]/ — e.g. "dashboard" → /acme/dashboard */
    href:       string;
    icon:       LucideIcon;
    /** Permission required to see this item. Items without permission are hidden entirely (RBAC). */
    permission: Permission;
    /**
     * Minimum plan required to navigate this item.
     * Items WITH requiredPlan are VISIBLE to all roles but show a <PlanTag> and are
     * non-navigable when the org's plan is below the required tier.
     *
     * This is intentionally different from permission gating:
     * - Permission gating → item disappears (user has no role access)
     * - Plan gating       → item visible with upgrade badge (user can upgrade to get it)
     */
    requiredPlan?: PlanName;
};

// ============================================
// NAVIGATION CONFIG
// ============================================

/**
 * Ordered list of sidebar navigation items.
 *
 * Items without requiredPlan are available on all plans (Free baseline).
 * Items with requiredPlan show a PlanTag when the org is below that tier.
 *
 * Rendering rules (applied in the sidebar component):
 * 1. Wrap in <Guard permission={item.permission}> — missing permission = item hidden
 * 2. If item.requiredPlan is set, wrap in plan check — below tier = item visible but non-navigable
 */
export const NAV_ITEMS: NavItem[] = [
    {
        label:      "Dashboard",
        href:       "dashboard",
        icon:       LayoutDashboard,
        permission: "dashboard.view",
    },
    {
        label:        "AI Assistant",
        href:         "ai",
        icon:         Bot,
        permission:   "dashboard.view",
        requiredPlan: "pro",
    },
    {
        label:        "Advanced Scans",
        href:         "advanced-scans",
        icon:         ScanSearch,
        permission:   "dashboard.view",
        requiredPlan: "pro",
    },
    {
        label:      "IAM",
        href:       "iam",
        icon:       Users,
        permission: "iam.manage",
    },
    {
        label:      "Billing",
        href:       "billing",
        icon:       CreditCard,
        permission: "billing.view",
    },
    {
        label:      "Settings",
        href:       "settings",
        icon:       Settings,
        permission: "settings.manage",
    },
    {
        label:      "Audit Log",
        href:       "audit",
        icon:       ClipboardList,
        permission: "audit.view",
    },
] as const satisfies NavItem[];
