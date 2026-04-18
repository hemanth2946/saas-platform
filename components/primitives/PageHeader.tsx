import { type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { typography } from "@/lib/ui"

// ── Types ─────────────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title:       string
  subtitle?:   string
  actions?:    ReactNode
  breadcrumb?: ReactNode
  className?:  string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-[var(--stack-gap-xs)]", className)}>
      {breadcrumb != null && (
        <div className="min-h-0">{breadcrumb}</div>
      )}
      <div className="flex flex-col gap-[var(--stack-gap-xs)] sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-[var(--stack-gap-xs)] min-w-0">
          <h1 className={typography.heading.page}>{title}</h1>
          {subtitle != null && (
            <p className={typography.body.muted}>{subtitle}</p>
          )}
        </div>
        {actions != null && (
          <div className="flex items-center gap-[var(--stack-gap-sm)] flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
