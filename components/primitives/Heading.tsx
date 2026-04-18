import { type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { typography } from "@/lib/ui"

// ── Types ─────────────────────────────────────────────────────────────────────

type HeadingLevel = "page" | "section" | "card" | "panel" | "group"

interface HeadingProps {
  level?:     HeadingLevel
  as?:        "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  className?: string
  children:   ReactNode
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_TAG: Record<HeadingLevel, "h1" | "h2" | "h3" | "h4" | "h5" | "h6"> = {
  page:    "h1",
  section: "h2",
  card:    "h3",
  panel:   "h4",
  group:   "h5",
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Heading({
  level     = "section",
  as,
  className,
  children,
}: HeadingProps) {
  const Tag = as ?? DEFAULT_TAG[level]

  return (
    <Tag className={cn(typography.heading[level], className)}>
      {children}
    </Tag>
  )
}
