"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { typography } from "@/lib/ui"
import {
  useRightPanelOpen,
  useRightPanelTitle,
  useRightPanelContent,
  useLayoutActions,
} from "@/store/layout.store"

// ── Component ─────────────────────────────────────────────────────────────────

export function RightPanel() {
  const isOpen  = useRightPanelOpen()
  const title   = useRightPanelTitle()
  const content = useRightPanelContent()
  const { closeRightPanel } = useLayoutActions()

  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const triggerRef     = useRef<HTMLElement | null>(null)

  // Store trigger element before opening — restore focus on close
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement
      // Move focus to close button
      setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 50)
    } else if (triggerRef.current != null) {
      triggerRef.current.focus()
      triggerRef.current = null
    }
  }, [isOpen])

  // ESC to close
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRightPanel()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, closeRightPanel])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-[var(--color-surface-overlay)] z-[var(--z-backdrop)]"
          onClick={closeRightPanel}
        />
      )}

      {/* Panel */}
      <aside
        className={cn(
          "right-panel fixed inset-y-0 right-0",
          "w-full md:w-[var(--right-panel-width)]",
          "bg-[var(--color-surface-primary)] border-l border-[var(--color-border-default)]",
          "z-[var(--z-modal)] flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full",
          "transition-transform duration-[250ms] ease-in-out"
        )}
        aria-label={title ?? "Panel"}
        aria-hidden={!isOpen}
        role="complementary"
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between",
            "h-[var(--topbar-height)] px-[var(--modal-padding)]",
            "border-b border-[var(--color-border-default)] flex-shrink-0"
          )}
        >
          {title != null && (
            <h2 className={typography.modal.title}>{title}</h2>
          )}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeRightPanel}
            className={cn(
              "ml-auto flex items-center justify-center rounded-md",
              "min-h-[var(--min-touch-target)] min-w-[var(--min-touch-target)]",
              "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]",
              "transition-colors duration-150"
            )}
            aria-label="Close panel"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-[var(--modal-padding)]">
          {content}
        </div>
      </aside>
    </>
  )
}
