// ============================================
// PERMISSION TYPES
// These are the TypeScript contracts only.
// Actual permission values always come from the server.
// usePermission() hook checks user's server-returned
// permissions[] against these types at runtime.
// ============================================

export type Permission =
    // Dashboard
    | "dashboard.view"
    | "dashboard.edit"
    // IAM — user management
    | "iam.view"
    | "iam.manage"
    | "iam.invite"
    | "iam.remove"
    | "iam.role.assign"
    // Billing
    | "billing.view"
    | "billing.manage"
    // Settings
    | "settings.view"
    | "settings.edit"
    | "settings.manage"
    // Audit log
    | "audit.view";

// Role-to-permissions map (reference only — enforced on backend)
// super_admin → all permissions
// admin       → all except billing.manage
// member      → dashboard.view, settings.view
// viewer      → dashboard.view only
export type UserRole = "super_admin" | "admin" | "member" | "viewer";