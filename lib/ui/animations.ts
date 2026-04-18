/* eslint-disable no-restricted-syntax */
/**
 * Animation / transition design tokens.
 * All transition and animation patterns for the project.
 */

export const animations = {
  fast:            "transition-all duration-150 ease-in-out",
  normal:          "transition-all duration-200 ease-in-out",
  slow:            "transition-all duration-300 ease-in-out",
  colors:          "transition-colors duration-150 ease-in-out",
  opacity:         "transition-opacity duration-200 ease-in-out",
  shadow:          "transition-shadow duration-150 ease-in-out",
  transform:       "transition-transform duration-200 ease-in-out",
  width:           "transition-[width] duration-200 ease-in-out",
  hover:           "hover:bg-[var(--color-surface-tertiary)] transition-colors duration-150",
  press:           "active:scale-[0.98] transition-transform duration-75",
  focusRing:       "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2",
  focusRingInset:  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-inset",
  sidebar:         "transition-[width] duration-200 ease-in-out",
  slideRight:      "translate-x-full data-[state=open]:translate-x-0 transition-transform duration-[250ms] ease-in-out",
  slideLeft:       "-translate-x-full data-[state=open]:translate-x-0 transition-transform duration-[250ms] ease-in-out",
  fadeIn:          "animate-in fade-in duration-200",
  fadeOut:         "animate-out fade-out duration-150",
  scaleIn:         "animate-in zoom-in-95 duration-200",
  scaleOut:        "animate-out zoom-out-95 duration-150",
} as const

export type AnimationKey = keyof typeof animations
