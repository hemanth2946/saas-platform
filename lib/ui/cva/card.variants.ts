/* eslint-disable no-restricted-syntax */
import { cva } from "class-variance-authority"

export const cardVariants = cva(
  "rounded-[var(--card-radius)] bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]",
  {
    variants: {
      padding: {
        none:    "",
        sm:      "p-[var(--card-padding-sm)]",
        default: "p-[var(--card-padding)]",
      },
      shadow: {
        none:    "",
        sm:      "shadow-sm",
        default: "shadow-sm",
        md:      "shadow-md",
      },
      interactive: {
        true:  "hover:border-[var(--color-border-strong)] hover:shadow-md cursor-pointer transition-all duration-150",
        false: "",
      },
    },
    defaultVariants: {
      padding:     "default",
      shadow:      "default",
      interactive: false,
    },
  }
)
