/**
 * Theme switching utility.
 * Supports light/dark themes — architecture ready for white-label (Phase 6+).
 * SSR-safe: no window access during server render.
 */

import { useState, useEffect, useCallback } from "react"

export type Theme = "light" | "dark"

const THEME_KEY = "theme"
const DEFAULT_THEME: Theme = "light"

/**
 * Reads the persisted theme preference from localStorage.
 * Returns DEFAULT_THEME if running on the server or no preference is stored.
 */
export function getTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME
  const stored = localStorage.getItem(THEME_KEY)
  return stored === "dark" ? "dark" : "light"
}

/**
 * Sets the active theme — applies data-theme attribute to <html>
 * and persists to localStorage.
 */
export function setTheme(theme: Theme): void {
  if (typeof window === "undefined") return
  document.documentElement.setAttribute("data-theme", theme)
  localStorage.setItem(THEME_KEY, theme)
}

/**
 * Initializes the theme before first paint to prevent flash.
 * Call this in AppShell on mount.
 */
export function initTheme(): void {
  setTheme(getTheme())
}

/**
 * React hook — returns [currentTheme, setThemeFn].
 * Reads persisted preference on mount, applies to documentElement.
 */
export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME)

  useEffect(() => {
    const stored = getTheme()
    setThemeState(stored)
    document.documentElement.setAttribute("data-theme", stored)
  }, [])

  const handleSetTheme = useCallback((next: Theme) => {
    setTheme(next)
    setThemeState(next)
  }, [])

  return [theme, handleSetTheme]
}
