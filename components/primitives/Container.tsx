import { type ElementType, type ReactNode } from "react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContainerProps {
  size?:      "default" | "narrow" | "wide"
  padded?:    boolean
  as?:        ElementType
  className?: string
  children:   ReactNode
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SIZE_MAP = {
  default: "max-w-[var(--content-max-width)] mx-auto",
  narrow:  "max-w-[var(--content-max-width-narrow)] mx-auto",
  wide:    "max-w-[var(--content-max-width-wide)] mx-auto",
} as const

// ── Component ─────────────────────────────────────────────────────────────────

export function Container({
  size    = "default",
  padded  = true,
  as:     Tag = "div",
  className,
  children,
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "w-full",
        SIZE_MAP[size],
        padded && "px-[var(--page-padding-x)] py-[var(--page-padding-y)]",
        className
      )}
    >
      {children}
    </Tag>
  )
}
