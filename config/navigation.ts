import {
    LayoutDashboard,
    Users,
    CreditCard,
    Settings,
    ClipboardList,
    type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/types";

// ============================================
// NAV ITEM TYPE
// ============================================

export type NavItem = {
    label: string;
    /** Route segment relative to /[orgId]/ — e.g. "dashboard" → /acme/dashboard */
    href: string;
    icon: LucideIcon;
    /** Permission required to see this item. Items without permission are hidden entirely. */
    permission: Permission;
};

// ============================================
// NAVIGATION CONFIG
// ============================================

/**
 * Ordered list of sidebar navigation items.
 * Each item is wrapped in <Guard permission={item.permission}> in the sidebar —
 * items the user cannot access are NOT rendered (not greyed, not disabled).
 */
export const NAV_ITEMS: NavItem[] = [
    {
        label: "Dashboard",
        href: "dashboard",
        icon: LayoutDashboard,
        permission: "dashboard.view",
    },
    {
        label: "IAM",
        href: "iam",
        icon: Users,
        permission: "iam.manage",
    },
    {
        label: "Billing",
        href: "billing",
        icon: CreditCard,
        permission: "billing.view",
    },
    {
        label: "Settings",
        href: "settings",
        icon: Settings,
        permission: "settings.manage",
    },
    {
        label: "Audit Log",
        href: "audit",
        icon: ClipboardList,
        permission: "audit.view",
    },
] as const satisfies NavItem[];
