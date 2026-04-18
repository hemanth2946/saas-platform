import type { Permission } from "@/types";

/**
 * PERMISSIONS — typed constants for every permission value.
 *
 * Every key maps exactly to a value in the Permission union type.
 * Use these instead of raw strings so typos are caught at compile time.
 *
 * @example
 * import { PERMISSIONS } from "@/config/permissions"
 * const canManage = permissions.includes(PERMISSIONS.IAM_MANAGE)
 */
export const PERMISSIONS = {
    // Dashboard
    DASHBOARD_VIEW:   "dashboard.view",
    DASHBOARD_EDIT:   "dashboard.edit",

    // IAM
    IAM_VIEW:         "iam.view",
    IAM_MANAGE:       "iam.manage",
    IAM_INVITE:       "iam.invite",
    IAM_REMOVE:       "iam.remove",
    IAM_ROLE_ASSIGN:  "iam.role.assign",

    // Billing
    BILLING_VIEW:     "billing.view",
    BILLING_MANAGE:   "billing.manage",

    // Settings
    SETTINGS_VIEW:    "settings.view",
    SETTINGS_EDIT:    "settings.edit",
    SETTINGS_MANAGE:  "settings.manage",

    // Audit
    AUDIT_VIEW:       "audit.view",

    // Scans
    SCAN_VIEW:        "scan.view",
    SCAN_CREATE:      "scan.create",
} as const satisfies Record<string, Permission>;

export type PermissionKey = keyof typeof PERMISSIONS;
