/* eslint-disable no-restricted-syntax */
import { cva } from "class-variance-authority"

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border font-semibold whitespace-nowrap leading-none",
  {
    variants: {
      variant: {
        success: "bg-[var(--color-status-success-surface)] text-[var(--color-status-success-text)] border-[var(--color-status-success-border)]",
        warning: "bg-[var(--color-status-warning-surface)] text-[var(--color-status-warning-text)] border-[var(--color-status-warning-border)]",
        error:   "bg-[var(--color-status-error-surface)] text-[var(--color-status-error-text)] border-[var(--color-status-error-border)]",
        neutral: "bg-[var(--color-status-neutral-surface)] text-[var(--color-status-neutral-text)] border-[var(--color-status-neutral-border)]",
        info:    "bg-[var(--color-status-info-surface)] text-[var(--color-status-info-text)] border-[var(--color-status-info-border)]",
      },
      size: {
        sm: "text-[0.625rem] px-1.5 py-0.5",
        md: "text-xs px-2 py-0.5",
        lg: "text-sm px-2.5 py-1",
      },
      dot: {
        true:  "gap-1.5 before:content-[''] before:inline-block before:w-1.5 before:h-1.5 before:rounded-full before:flex-shrink-0",
        false: "",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size:    "md",
      dot:     false,
    },
  }
)
