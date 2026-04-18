/* eslint-disable no-restricted-syntax */
/**
 * Layout dimension tokens.
 * All fixed dimensions reference CSS variables — no arbitrary pixel values.
 */

export const layoutTokens = {
  topbar:            "h-[var(--topbar-height)]",
  bottomBar:         "h-[var(--bottom-bar-height)]",
  tableRow:          "h-[var(--table-row-height)]",
  tableHeader:       "h-[var(--table-header-height)]",
  inputSm:           "h-[var(--input-height-sm)]",
  input:             "h-[var(--input-height)]",
  inputLg:           "h-[var(--input-height-lg)]",
  touchMin:          "min-h-[var(--min-touch-target)] min-w-[var(--min-touch-target)]",
  sidebarExpanded:   "w-[var(--sidebar-width-expanded)]",
  sidebarCollapsed:  "w-[var(--sidebar-width-collapsed)]",
  rightPanel:        "w-[var(--right-panel-width)]",
  modalSm:           "w-[var(--modal-width-sm)]",
  modalMd:           "w-[var(--modal-width-md)]",
  modalLg:           "w-[var(--modal-width-lg)]",
  modalXl:           "w-[var(--modal-width-xl)]",
  contentDefault:    "max-w-[var(--content-max-width)] mx-auto",
  contentNarrow:     "max-w-[var(--content-max-width-narrow)] mx-auto",
  contentWide:       "max-w-[var(--content-max-width-wide)] mx-auto",
  zDropdown:         "z-[var(--z-dropdown)]",
  zSticky:           "z-[var(--z-sticky)]",
  zBackdrop:         "z-[var(--z-backdrop)]",
  zModal:            "z-[var(--z-modal)]",
  zToast:            "z-[var(--z-toast)]",
  zTooltip:          "z-[var(--z-tooltip)]",
} as const

export type LayoutTokenKey = keyof typeof layoutTokens
