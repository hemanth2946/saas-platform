"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ScanSearch, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth.store"

// ── Bottom nav items (max 5, mobile-worthy routes) ────────────────────────────

const BOTTOM_NAV = [
  { label: "Dashboard", href: "dashboard", icon: LayoutDashboard },
  { label: "Scans",     href: "advanced-scans", icon: ScanSearch },
  { label: "Settings",  href: "settings",   icon: Settings },
] as const

// ── Component ─────────────────────────────────────────────────────────────────

export function BottomBar() {
  const pathname = usePathname()
  const org      = useAuthStore((s) => s.org)

  if (org == null) return null

  return (
    <nav
      className={cn(
        "fixed bottom-0 inset-x-0 h-[var(--bottom-bar-height)]",
        "bg-[var(--color-surface-primary)] border-t border-[var(--color-border-default)]",
        "z-[var(--z-sticky)]",
        "flex items-center justify-around",
        // Hidden on desktop
        "md:hidden"
      )}
      aria-label="Mobile bottom navigation"
    >
      {BOTTOM_NAV.map((item) => {
        const href     = `/${org.id}/${item.href}`
        const isActive = (pathname ?? "").startsWith(href)
        const Icon     = item.icon

        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5",
              "min-h-[var(--min-touch-target)] min-w-[var(--min-touch-target)]",
              "flex-1 rounded-md",
              "transition-colors duration-150",
              isActive
                ? "text-[var(--color-interactive-primary)]"
                : "text-[var(--color-text-secondary)]"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="size-5" aria-hidden="true" />
            <span className="text-[0.625rem] font-medium leading-none">
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
