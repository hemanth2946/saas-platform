import { type ElementType, type ReactNode } from "react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface StackProps {
  direction?: "vertical" | "horizontal"
  gap?:       "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  align?:     "start" | "center" | "end" | "stretch"
  justify?:   "start" | "center" | "end" | "between" | "around"
  wrap?:      boolean
  as?:        ElementType
  className?: string
  children:   ReactNode
}

// ── Constants (defined outside render to prevent re-creation) ─────────────────

const GAP_MAP = {
  xs:  "gap-[var(--stack-gap-xs)]",
  sm:  "gap-[var(--stack-gap-sm)]",
  md:  "gap-[var(--stack-gap-md)]",
  lg:  "gap-[var(--stack-gap-lg)]",
  xl:  "gap-[var(--stack-gap-xl)]",
  "2xl": "gap-[var(--stack-gap-2xl)]",
} as const

const ALIGN_MAP = {
  start:   "items-start",
  center:  "items-center",
  end:     "items-end",
  stretch: "items-stretch",
} as const

const JUSTIFY_MAP = {
  start:   "justify-start",
  center:  "justify-center",
  end:     "justify-end",
  between: "justify-between",
  around:  "justify-around",
} as const

// ── Component ─────────────────────────────────────────────────────────────────

export function Stack({
  direction = "vertical",
  gap       = "md",
  align     = "stretch",
  justify,
  wrap,
  as:       Tag = "div",
  className,
  children,
}: StackProps) {
  return (
    <Tag
      className={cn(
        "flex",
        direction === "vertical" ? "flex-col" : "flex-row",
        GAP_MAP[gap],
        ALIGN_MAP[align],
        justify != null && JUSTIFY_MAP[justify],
        wrap && "flex-wrap",
        className
      )}
    >
      {children}
    </Tag>
  )
}
