/* eslint-disable no-restricted-syntax */
import { cva } from "class-variance-authority"

export const inputVariants = cva(
  [
    "flex w-full rounded-md border bg-[var(--color-surface-primary)]",
    "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]",
    "transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-0",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      state: {
        default: "border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]",
        error:   "border-[var(--color-border-error)] focus-visible:ring-[var(--color-border-error)]",
        success: "border-[var(--color-border-success)]",
      },
      size: {
        sm: "h-[var(--input-height-sm)] px-[var(--input-padding-x)] text-xs",
        md: "h-[var(--input-height)] px-[var(--input-padding-x)] text-sm",
        lg: "h-[var(--input-height-lg)] px-[var(--input-padding-x)] text-base",
      },
    },
    defaultVariants: {
      state: "default",
      size:  "md",
    },
  }
)
