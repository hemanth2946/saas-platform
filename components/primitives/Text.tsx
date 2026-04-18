import { type ElementType, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { typography } from "@/lib/ui"

// ── Types ─────────────────────────────────────────────────────────────────────

interface TextProps {
  variant?:   "default" | "muted" | "subtle" | "lg" | "sm"
  feedback?:  "error" | "success" | "warning" | "info"
  weight?:    "normal" | "medium" | "semibold"
  truncate?:  boolean
  clamp?:     2 | 3
  noWrap?:    boolean
  breakWord?: boolean
  as?:        ElementType
  className?: string
  children:   ReactNode
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WEIGHT_MAP = {
  normal:   "font-normal",
  medium:   "font-medium",
  semibold: "font-semibold",
} as const

// ── Component ─────────────────────────────────────────────────────────────────

export function Text({
  variant   = "default",
  feedback,
  weight,
  truncate,
  clamp,
  noWrap,
  breakWord,
  as:       Tag = "p",
  className,
  children,
}: TextProps) {
  // feedback takes priority over variant
  const baseClass =
    feedback != null
      ? typography.feedback[feedback]
      : typography.body[variant]

  return (
    <Tag
      className={cn(
        baseClass,
        weight != null && WEIGHT_MAP[weight],
        truncate   && typography.overflow.truncate,
        clamp === 2 && typography.overflow.clamp2,
        clamp === 3 && typography.overflow.clamp3,
        noWrap     && typography.overflow.noWrap,
        breakWord  && typography.overflow.breakWord,
        className
      )}
    >
      {children}
    </Tag>
  )
}
