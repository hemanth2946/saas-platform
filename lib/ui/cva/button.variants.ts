/* eslint-disable no-restricted-syntax */
import { cva, type VariantProps } from "class-variance-authority"

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap",
    "transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "min-h-[var(--min-touch-target)]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--color-interactive-primary)] text-white",
          "hover:bg-[var(--color-interactive-primary-hover)]",
          "active:bg-[var(--color-interactive-primary-active)]",
        ],
        secondary: [
          "bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-default)]",
          "hover:bg-[var(--color-surface-tertiary)] hover:border-[var(--color-border-strong)]",
        ],
        danger: [
          "bg-[var(--color-interactive-danger)] text-white",
          "hover:bg-[var(--color-interactive-danger-hover)]",
        ],
        ghost: [
          "bg-transparent text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-surface-secondary)]",
        ],
        outline: [
          "bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border-default)]",
          "hover:bg-[var(--color-surface-secondary)] hover:border-[var(--color-border-strong)]",
        ],
        link: [
          "bg-transparent text-[var(--color-text-link)] underline-offset-4",
          "hover:underline",
        ],
      },
      size: {
        sm:      "h-[var(--input-height-sm)] px-3 text-xs gap-1.5",
        md:      "h-[var(--input-height)] px-4 text-sm gap-2",
        lg:      "h-[var(--input-height-lg)] px-6 text-base gap-2",
        "icon-sm": "h-[var(--input-height-sm)] w-[var(--input-height-sm)] p-0",
        "icon-md": "h-[var(--input-height)] w-[var(--input-height)] p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size:    "md",
    },
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
