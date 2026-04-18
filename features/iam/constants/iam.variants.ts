/**
 * IAM-specific variant maps.
 * Used only within the IAM feature: user table, invite flow, roles.
 */

// ── User status variants ──────────────────────────────────────────────────────

export const userStatusVariants = {
  active: {
    label:     "Active",
    className: "bg-[var(--color-status-success-surface)] text-[var(--color-status-success-text)] border border-[var(--color-status-success-border)]",
    dot:       "bg-[var(--color-status-success-text)]",
  },
  pending: {
    label:     "Pending",
    className: "bg-[var(--color-status-warning-surface)] text-[var(--color-status-warning-text)] border border-[var(--color-status-warning-border)]",
    dot:       "bg-[var(--color-status-warning-text)]",
  },
  suspended: {
    label:     "Suspended",
    className: "bg-[var(--color-status-error-surface)] text-[var(--color-status-error-text)] border border-[var(--color-status-error-border)]",
    dot:       "bg-[var(--color-status-error-text)]",
  },
  expired: {
    label:     "Expired",
    className: "bg-[var(--color-status-neutral-surface)] text-[var(--color-status-neutral-text)] border border-[var(--color-status-neutral-border)]",
    dot:       "bg-[var(--color-status-neutral-text)]",
  },
  invited: {
    label:     "Invited",
    className: "bg-[var(--color-status-info-surface)] text-[var(--color-status-info-text)] border border-[var(--color-status-info-border)]",
    dot:       "bg-[var(--color-status-info-text)]",
  },
} as const satisfies Record<string, { label: string; className: string; dot: string }>

export type UserStatus = keyof typeof userStatusVariants

// ── Invite status variants ────────────────────────────────────────────────────

export const inviteStatusVariants = {
  accepted: {
    label:     "Accepted",
    className: "bg-[var(--color-status-success-surface)] text-[var(--color-status-success-text)] border border-[var(--color-status-success-border)]",
    icon:      "CheckCircle",
  },
  pending: {
    label:     "Pending",
    className: "bg-[var(--color-status-warning-surface)] text-[var(--color-status-warning-text)] border border-[var(--color-status-warning-border)]",
    icon:      "Clock",
  },
} as const satisfies Record<string, { label: string; className: string; icon: string }>

export type InviteStatus = keyof typeof inviteStatusVariants

// ── Role variants ─────────────────────────────────────────────────────────────

export const roleVariants = {
  super_admin: {
    label:     "Super Admin",
    className: "bg-[var(--color-role-superadmin-surface)] text-[var(--color-role-superadmin-text)] border border-[var(--color-role-superadmin-border)]",
  },
  admin: {
    label:     "Admin",
    className: "bg-[var(--color-role-admin-surface)] text-[var(--color-role-admin-text)] border border-[var(--color-role-admin-border)]",
  },
  member: {
    label:     "Member",
    className: "bg-[var(--color-role-member-surface)] text-[var(--color-role-member-text)] border border-[var(--color-role-member-border)]",
  },
  viewer: {
    label:     "Viewer",
    className: "bg-[var(--color-role-viewer-surface)] text-[var(--color-role-viewer-text)] border border-[var(--color-role-viewer-border)]",
  },
} as const satisfies Record<string, { label: string; className: string }>

export type RoleVariant = keyof typeof roleVariants
