/* eslint-disable no-restricted-syntax */
import { cva } from "class-variance-authority"

export const alertVariants = cva(
  "flex items-start gap-3 rounded-md border",
  {
    variants: {
      variant: {
        info:    "bg-[var(--color-status-info-surface)] text-[var(--color-status-info-text)] border-[var(--color-status-info-border)]",
        success: "bg-[var(--color-status-success-surface)] text-[var(--color-status-success-text)] border-[var(--color-status-success-border)]",
        warning: "bg-[var(--color-status-warning-surface)] text-[var(--color-status-warning-text)] border-[var(--color-status-warning-border)]",
        error:   "bg-[var(--color-status-error-surface)] text-[var(--color-status-error-text)] border-[var(--color-status-error-border)]",
      },
      size: {
        sm: "p-3 text-xs",
        md: "p-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "info",
      size:    "md",
    },
  }
)
