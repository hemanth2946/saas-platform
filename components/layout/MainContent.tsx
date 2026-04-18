import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface MainContentProps {
  children: ReactNode
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MainContent({ children }: MainContentProps) {
  return (
    <main
      className={cn(
        "flex-1 min-w-0 overflow-y-auto",
        "bg-[var(--color-surface-page)]",
        // On mobile, add padding-bottom for the bottom bar
        "pb-[var(--bottom-bar-height)] md:pb-0"
      )}
    >
      {children}
    </main>
  )
}
