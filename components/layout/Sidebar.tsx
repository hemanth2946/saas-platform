"use client"

import { useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { typography } from "@/lib/ui"
import { useAuthStore } from "@/store/auth.store"
import {
  useSidebarOpen,
  useMobileSidebarOpen,
  useLayoutActions,
} from "@/store/layout.store"
import { Guard } from "@/components/auth/Guard"
import { PlanTag } from "@/components/plan/PlanTag"
import { NAV_ITEMS } from "@/config/navigation"
import { roleVariants, type RoleVariant } from "@/features/iam/constants/iam.variants"

// ── Component ─────────────────────────────────────────────────────────────────

export function Sidebar() {
  const sidebarOpen       = useSidebarOpen()
  const mobileSidebarOpen = useMobileSidebarOpen()
  const { toggleSidebar, closeMobileSidebar } = useLayoutActions()

  const pathname = usePathname()
  const org         = useAuthStore((s) => s.org)
  const primaryRole = useAuthStore((s) => s.roles[0] ?? null)

  const handleNavClick = useCallback(() => {
    closeMobileSidebar()
  }, [closeMobileSidebar])

  const roleVariant =
    primaryRole != null && primaryRole in roleVariants
      ? roleVariants[primaryRole as RoleVariant]
      : null

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sidebar hidden md:flex flex-col",
          "bg-[var(--color-surface-primary)] border-r border-[var(--color-border-default)]",
          "flex-shrink-0 overflow-hidden",
          sidebarOpen
            ? "w-[var(--sidebar-width-expanded)]"
            : "w-[var(--sidebar-width-collapsed)]"
        )}
        aria-label="Main navigation"
      >
        <SidebarContent
          sidebarOpen={sidebarOpen}
          pathname={pathname ?? ""}
          orgId={org?.id ?? ""}
          roleVariant={roleVariant}
          onNavClick={handleNavClick}
          onToggle={toggleSidebar}
        />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "sidebar fixed inset-y-0 left-0 z-[var(--z-modal)] flex flex-col md:hidden",
          "w-[var(--sidebar-width-expanded)]",
          "bg-[var(--color-surface-primary)] border-r border-[var(--color-border-default)]",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "transition-transform duration-200 ease-in-out"
        )}
        aria-label="Mobile navigation"
        aria-hidden={!mobileSidebarOpen}
      >
        <SidebarContent
          sidebarOpen
          pathname={pathname ?? ""}
          orgId={org?.id ?? ""}
          roleVariant={roleVariant}
          onNavClick={handleNavClick}
          onToggle={closeMobileSidebar}
        />
      </aside>
    </>
  )
}

// ── Inner content (shared by desktop + mobile) ────────────────────────────────

interface SidebarContentProps {
  sidebarOpen:  boolean
  pathname:     string
  orgId:        string
  roleVariant:  { label: string; className: string } | null
  onNavClick:   () => void
  onToggle:     () => void
}

function SidebarContent({
  sidebarOpen,
  pathname,
  orgId,
  roleVariant,
  onNavClick,
  onToggle,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Scrollable nav area */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul role="list" className="flex flex-col gap-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const href    = `/${orgId}/${item.href}`
            const isActive = pathname.startsWith(href)
            const Icon    = item.icon
            const hasUpgrade = item.requiredPlan != null

            return (
              <Guard key={item.href} permission={item.permission}>
                <li>
                  {hasUpgrade ? (
                    // Plan-gated: visible but non-navigable
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3",
                        "min-h-[var(--min-touch-target)]",
                        "text-[var(--color-text-tertiary)] cursor-default",
                        !sidebarOpen && "justify-center px-2"
                      )}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <Icon className="size-5 flex-shrink-0" aria-hidden="true" />
                      {sidebarOpen && (
                        <>
                          <span className={cn(typography.nav.item, "flex-1")}>
                            {item.label}
                          </span>
                          <PlanTag variant={item.requiredPlan as "pro" | "growth"} />
                        </>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={href}
                      onClick={onNavClick}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3",
                        "min-h-[var(--min-touch-target)]",
                        "transition-colors duration-150",
                        isActive
                          ? "bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]",
                        !sidebarOpen && "justify-center px-2"
                      )}
                      aria-current={isActive ? "page" : undefined}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <Icon className="size-5 flex-shrink-0" aria-hidden="true" />
                      {sidebarOpen && (
                        <span className={cn(typography.nav.item, "flex-1")}>
                          {item.label}
                        </span>
                      )}
                    </Link>
                  )}
                </li>
              </Guard>
            )
          })}
        </ul>
      </nav>

      {/* Role badge at bottom */}
      {sidebarOpen && roleVariant != null && (
        <div className="px-4 py-3 border-t border-[var(--color-border-default)]">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5",
              "text-xs font-semibold leading-none",
              roleVariant.className
            )}
          >
            {roleVariant.label}
          </span>
        </div>
      )}

      {/* Toggle button */}
      <div className="border-t border-[var(--color-border-default)] p-2">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex items-center justify-center w-full rounded-md",
            "min-h-[var(--min-touch-target)]",
            "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]",
            "transition-colors duration-150"
          )}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <ChevronLeft className="size-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
}
