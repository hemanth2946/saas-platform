import { type ReactNode } from "react"
import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"
import { persist, devtools } from "zustand/middleware"

// ── Types ─────────────────────────────────────────────────────────────────────

type LayoutState = {
  sidebarOpen:       boolean
  mobileSidebarOpen: boolean
  rightPanelOpen:    boolean
  rightPanelTitle:   string | null
  rightPanelContent: ReactNode | null
}

type LayoutActions = {
  toggleSidebar:   () => void
  setSidebarOpen:  (open: boolean) => void
  openMobileSidebar:  () => void
  closeMobileSidebar: () => void
  openRightPanel:  (content: ReactNode, title: string) => void
  closeRightPanel: () => void
  clearRightPanel: () => void
}

type LayoutStore = LayoutState & LayoutActions

// ── Store ─────────────────────────────────────────────────────────────────────

/**
 * Layout store — manages sidebar + right panel state.
 *
 * Persistence:
 *   - sidebarOpen → persisted to localStorage ("sidebar-open")
 *   - Everything else → NOT persisted (transient UI state)
 */
const useLayoutStore = create<LayoutStore>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen:       true,
        mobileSidebarOpen: false,
        rightPanelOpen:    false,
        rightPanelTitle:   null,
        rightPanelContent: null,

        toggleSidebar: () =>
          set(
            (state) => ({ sidebarOpen: !state.sidebarOpen }),
            false,
            "layout/toggleSidebar"
          ),

        setSidebarOpen: (open) =>
          set({ sidebarOpen: open }, false, "layout/setSidebarOpen"),

        openMobileSidebar: () =>
          set({ mobileSidebarOpen: true }, false, "layout/openMobileSidebar"),

        closeMobileSidebar: () =>
          set({ mobileSidebarOpen: false }, false, "layout/closeMobileSidebar"),

        openRightPanel: (content, title) =>
          set(
            { rightPanelOpen: true, rightPanelContent: content, rightPanelTitle: title },
            false,
            "layout/openRightPanel"
          ),

        closeRightPanel: () =>
          set({ rightPanelOpen: false }, false, "layout/closeRightPanel"),

        clearRightPanel: () =>
          set(
            { rightPanelOpen: false, rightPanelContent: null, rightPanelTitle: null },
            false,
            "layout/clearRightPanel"
          ),
      }),
      {
        name:       "sidebar-open",
        partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
      }
    ),
    { name: "LayoutStore" }
  )
)

// ── Granular selectors ────────────────────────────────────────────────────────

export const useSidebarOpen       = () => useLayoutStore((s) => s.sidebarOpen)
export const useMobileSidebarOpen = () => useLayoutStore((s) => s.mobileSidebarOpen)
export const useRightPanelOpen    = () => useLayoutStore((s) => s.rightPanelOpen)
export const useRightPanelTitle   = () => useLayoutStore((s) => s.rightPanelTitle)
export const useRightPanelContent = () => useLayoutStore((s) => s.rightPanelContent)

export const useLayoutActions = () =>
  useLayoutStore(
    useShallow((s) => ({
      toggleSidebar:      s.toggleSidebar,
      setSidebarOpen:     s.setSidebarOpen,
      openMobileSidebar:  s.openMobileSidebar,
      closeMobileSidebar: s.closeMobileSidebar,
      openRightPanel:     s.openRightPanel,
      closeRightPanel:    s.closeRightPanel,
      clearRightPanel:    s.clearRightPanel,
    }))
  )
