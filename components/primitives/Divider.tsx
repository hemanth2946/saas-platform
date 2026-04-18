import { cn } from "@/lib/utils"
import { typography } from "@/lib/ui"

// ── Types ─────────────────────────────────────────────────────────────────────

interface DividerProps {
  orientation?: "horizontal" | "vertical"
  spacing?:     "sm" | "md" | "lg"
  label?:       string
  className?:   string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SPACING_MAP = {
  sm: "my-2",
  md: "my-4",
  lg: "my-6",
} as const

const V_SPACING_MAP = {
  sm: "mx-2",
  md: "mx-4",
  lg: "mx-6",
} as const

// ── Component ─────────────────────────────────────────────────────────────────

export function Divider({
  orientation = "horizontal",
  spacing     = "md",
  label,
  className,
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "w-px self-stretch bg-[var(--color-border-default)]",
          V_SPACING_MAP[spacing],
          className
        )}
      />
    )
  }

  if (label != null) {
    return (
      <div
        role="separator"
        className={cn(
          "flex items-center gap-3",
          SPACING_MAP[spacing],
          className
        )}
      >
        <div className="flex-1 h-px bg-[var(--color-border-default)]" aria-hidden="true" />
        <span className={typography.label.sm}>{label}</span>
        <div className="flex-1 h-px bg-[var(--color-border-default)]" aria-hidden="true" />
      </div>
    )
  }

  return (
    <hr
      className={cn(
        "border-0 border-t border-[var(--color-border-default)]",
        SPACING_MAP[spacing],
        className
      )}
    />
  )
}
