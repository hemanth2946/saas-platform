"use client"

import { type ReactNode, useEffect } from "react"
import { cn } from "@/lib/utils"
import { initTheme } from "@/lib/theme"
import { useMobileSidebarOpen, useLayoutActions } from "@/store/layout.store"
import { TopBar }      from "./TopBar"
import { Sidebar }     from "./Sidebar"
import { MainContent } from "./MainContent"
import { RightPanel }  from "./RightPanel"
import { BottomBar }   from "./BottomBar"

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppShellProps {
  children: ReactNode
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AppShell({ children }: AppShellProps) {
  const mobileSidebarOpen   = useMobileSidebarOpen()
  const { closeMobileSidebar } = useLayoutActions()

  // Initialize theme before first paint — prevents flash
  useEffect(() => {
    initTheme()
  }, [])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileSidebarOpen])

  return (
    <div className="shell-root">
      <TopBar />
      <div className="shell-body">
        <Sidebar />

        {/* Mobile sidebar backdrop */}
        {mobileSidebarOpen && (
          <div
            aria-hidden="true"
            className={cn(
              "fixed inset-0 bg-[var(--color-surface-overlay)]",
              "z-[var(--z-backdrop)] md:hidden"
            )}
            onClick={closeMobileSidebar}
          />
        )}

        <MainContent>{children}</MainContent>
        <RightPanel />
      </div>
      <BottomBar />
    </div>
  )
}
