/* eslint-disable no-restricted-syntax */
/**
 * GLOBAL variant maps — used across 3+ features.
 *
 * Feature-specific variants:
 *   IAM     → features/iam/constants/iam.variants.ts
 *   Billing → features/billing/constants/billing.variants.ts
 */

// ── Severity variants ─────────────────────────────────────────────────────────

export const severityVariants = {
  critical: {
    label:     "Critical",
    className: "bg-[var(--color-severity-critical-surface)] text-[var(--color-severity-critical-text)] border border-[var(--color-severity-critical-border)]",
    dot:       "bg-[var(--color-severity-critical-dot)]",
    priority:  1,
  },
  high: {
    label:     "High",
    className: "bg-[var(--color-severity-high-surface)] text-[var(--color-severity-high-text)] border border-[var(--color-severity-high-border)]",
    dot:       "bg-[var(--color-severity-high-dot)]",
    priority:  2,
  },
  medium: {
    label:     "Medium",
    className: "bg-[var(--color-severity-medium-surface)] text-[var(--color-severity-medium-text)] border border-[var(--color-severity-medium-border)]",
    dot:       "bg-[var(--color-severity-medium-dot)]",
    priority:  3,
  },
  low: {
    label:     "Low",
    className: "bg-[var(--color-severity-low-surface)] text-[var(--color-severity-low-text)] border border-[var(--color-severity-low-border)]",
    dot:       "bg-[var(--color-severity-low-dot)]",
    priority:  4,
  },
  info: {
    label:     "Info",
    className: "bg-[var(--color-severity-info-surface)] text-[var(--color-severity-info-text)] border border-[var(--color-severity-info-border)]",
    dot:       "bg-[var(--color-severity-info-dot)]",
    priority:  5,
  },
} as const satisfies Record<string, { label: string; className: string; dot: string; priority: number }>

export type SeverityLevel = keyof typeof severityVariants

// ── Flag status variants ──────────────────────────────────────────────────────

export const flagStatusVariants = {
  enabled: {
    label:     "Enabled",
    className: "bg-[var(--color-status-success-surface)] text-[var(--color-status-success-text)] border border-[var(--color-status-success-border)]",
  },
  disabled: {
    label:     "Disabled",
    className: "bg-[var(--color-status-neutral-surface)] text-[var(--color-status-neutral-text)] border border-[var(--color-status-neutral-border)]",
  },
} as const satisfies Record<string, { label: string; className: string }>

export type FlagStatus = keyof typeof flagStatusVariants
