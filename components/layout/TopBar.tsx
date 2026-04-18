"use client"

import { Menu, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { typography } from "@/lib/ui"
import { useAuthStore } from "@/store/auth.store"
import { useLayoutActions } from "@/store/layout.store"

// ── Component ─────────────────────────────────────────────────────────────────

export function TopBar() {
  const user    = useAuthStore((s) => s.user)
  const org     = useAuthStore((s) => s.org)
  const { openMobileSidebar } = useLayoutActions()

  const initials =
    user?.name != null
      ? user.name
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0] ?? "")
          .join("")
          .toUpperCase()
      : (user?.email?.[0]?.toUpperCase() ?? "?")

  return (
    <header
      className={cn(
        "h-[var(--topbar-height)] flex items-center px-4 gap-3",
        "bg-[var(--color-surface-primary)] border-b border-[var(--color-border-default)]",
        "z-[var(--z-sticky)]",
        "flex-shrink-0"
      )}
    >
      {/* Hamburger — mobile only */}
      <button
        type="button"
        className={cn(
          "md:hidden flex items-center justify-center rounded-md",
          "min-h-[var(--min-touch-target)] min-w-[var(--min-touch-target)]",
          "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]",
          "transition-colors duration-150"
        )}
        aria-label="Open navigation menu"
        onClick={openMobileSidebar}
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {/* Logo / brand */}
      <span className={cn(typography.heading.panel, "flex-shrink-0")}>
        SaaS Platform
      </span>

      {/* Org switcher placeholder */}
      {org != null && (
        <div
          className={cn(
            "hidden sm:flex items-center px-3 rounded-md",
            "h-8 border border-[var(--color-border-default)]",
            "bg-[var(--color-surface-secondary)]",
            typography.body.muted,
            "max-w-[12rem] truncate"
          )}
          aria-label={`Current organization: ${org.name}`}
        >
          {org.name}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications placeholder */}
      <button
        type="button"
        className={cn(
          "flex items-center justify-center rounded-md",
          "min-h-[var(--min-touch-target)] min-w-[var(--min-touch-target)]",
          "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]",
          "transition-colors duration-150"
        )}
        aria-label="View notifications"
      >
        <Bell className="size-5" aria-hidden="true" />
      </button>

      {/* Avatar placeholder */}
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          "size-8 flex-shrink-0",
          "bg-[var(--color-interactive-primary)] text-white",
          "text-xs font-semibold select-none"
        )}
        aria-label={`User: ${user?.name ?? user?.email ?? "Unknown"}`}
        role="img"
      >
        {initials}
      </div>
    </header>
  )
}
