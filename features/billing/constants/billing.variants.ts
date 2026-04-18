/**
 * Billing-specific variant maps.
 * Used only within the Billing feature.
 */

// ── Subscription status variants ──────────────────────────────────────────────

export const subscriptionStatusVariants = {
  active: {
    label:     "Active",
    className: "bg-[var(--color-status-success-surface)] text-[var(--color-status-success-text)] border border-[var(--color-status-success-border)]",
  },
  trialing: {
    label:     "Trialing",
    className: "bg-[var(--color-status-info-surface)] text-[var(--color-status-info-text)] border border-[var(--color-status-info-border)]",
  },
  past_due: {
    label:     "Past Due",
    className: "bg-[var(--color-status-warning-surface)] text-[var(--color-status-warning-text)] border border-[var(--color-status-warning-border)]",
  },
  canceled: {
    label:     "Canceled",
    className: "bg-[var(--color-status-neutral-surface)] text-[var(--color-status-neutral-text)] border border-[var(--color-status-neutral-border)]",
  },
  unpaid: {
    label:     "Unpaid",
    className: "bg-[var(--color-status-error-surface)] text-[var(--color-status-error-text)] border border-[var(--color-status-error-border)]",
  },
} as const satisfies Record<string, { label: string; className: string }>

export type SubscriptionStatus = keyof typeof subscriptionStatusVariants
