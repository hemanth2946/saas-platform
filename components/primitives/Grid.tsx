import { type ElementType, type ReactNode } from "react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface GridProps {
  cols?:     1 | 2 | 3 | 4 | 6 | 12
  smCols?:   1 | 2 | 3 | 4
  mdCols?:   1 | 2 | 3 | 4 | 6
  lgCols?:   1 | 2 | 3 | 4 | 6 | 12
  gap?:      "xs" | "sm" | "md" | "lg" | "xl"
  as?:       ElementType
  className?: string
  children:  ReactNode
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COLS_MAP: Record<number, string> = {
  1:  "grid-cols-1",
  2:  "grid-cols-2",
  3:  "grid-cols-3",
  4:  "grid-cols-4",
  6:  "grid-cols-6",
  12: "grid-cols-12",
}

const SM_COLS_MAP: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
}

const MD_COLS_MAP: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  6: "md:grid-cols-6",
}

const LG_COLS_MAP: Record<number, string> = {
  1:  "lg:grid-cols-1",
  2:  "lg:grid-cols-2",
  3:  "lg:grid-cols-3",
  4:  "lg:grid-cols-4",
  6:  "lg:grid-cols-6",
  12: "lg:grid-cols-12",
}

const GAP_MAP = {
  xs:  "gap-[var(--stack-gap-xs)]",
  sm:  "gap-[var(--stack-gap-sm)]",
  md:  "gap-[var(--stack-gap-md)]",
  lg:  "gap-[var(--stack-gap-lg)]",
  xl:  "gap-[var(--stack-gap-xl)]",
} as const

// ── Component ─────────────────────────────────────────────────────────────────

export function Grid({
  cols     = 1,
  smCols,
  mdCols,
  lgCols,
  gap      = "md",
  as:      Tag = "div",
  className,
  children,
}: GridProps) {
  return (
    <Tag
      className={cn(
        "grid",
        COLS_MAP[cols],
        smCols != null && SM_COLS_MAP[smCols],
        mdCols != null && MD_COLS_MAP[mdCols],
        lgCols != null && LG_COLS_MAP[lgCols],
        GAP_MAP[gap],
        className
      )}
    >
      {children}
    </Tag>
  )
}
