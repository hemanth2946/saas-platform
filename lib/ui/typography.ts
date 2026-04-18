/* eslint-disable no-restricted-syntax */
/**
 * Typography design tokens — grouped by semantic role.
 * ALL text styles in the project use these constants.
 * Never use raw Tailwind text-* / font-* classes in components.
 * Dark mode compatible — all colors via CSS variables.
 *
 * Hierarchy:
 *   heading.page (2xl)  → heading.section (xl)  → heading.card (lg)
 *     → body.default (sm)  → body.muted (sm secondary)
 *       → body.subtle (xs tertiary)
 */

export const typography = {

  heading: {
    page:    "text-xl sm:text-2xl font-semibold text-[var(--color-text-primary)] leading-tight",
    section: "text-lg sm:text-xl font-semibold text-[var(--color-text-primary)] leading-tight",
    card:    "text-base sm:text-lg font-semibold text-[var(--color-text-primary)] leading-snug",
    panel:   "text-base font-semibold text-[var(--color-text-primary)] leading-snug",
    group:   "text-[0.625rem] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest leading-none",
  },

  body: {
    lg:      "text-base font-normal text-[var(--color-text-primary)] leading-relaxed",
    default: "text-sm font-normal text-[var(--color-text-primary)] leading-normal",
    sm:      "text-xs font-normal text-[var(--color-text-primary)] leading-normal",
    muted:   "text-sm font-normal text-[var(--color-text-secondary)] leading-normal",
    subtle:  "text-xs font-normal text-[var(--color-text-tertiary)] leading-normal",
  },

  label: {
    default: "text-sm font-medium text-[var(--color-text-primary)] leading-none",
    sm:      "text-xs font-medium text-[var(--color-text-primary)] leading-none",
    muted:   "text-sm font-medium text-[var(--color-text-secondary)] leading-none",
    form:    "text-sm font-medium text-[var(--color-text-primary)] leading-none",
    hint:    "text-xs font-normal text-[var(--color-text-secondary)] leading-normal",
    error:   "text-xs font-medium text-[var(--color-text-error)] leading-normal",
  },

  table: {
    header:   "text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider leading-none",
    cell:     "text-sm font-normal text-[var(--color-text-primary)] leading-normal truncate",
    cellMuted:"text-sm font-normal text-[var(--color-text-secondary)] leading-normal truncate",
    cellMono: "text-sm font-mono text-[var(--color-text-primary)] leading-normal tabular-nums",
  },

  nav: {
    item:    "text-sm font-medium leading-none truncate",
    section: "text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)] leading-none",
    badge:   "text-xs font-semibold leading-none",
  },

  ui: {
    button:    "text-sm font-medium leading-none",
    buttonSm:  "text-xs font-medium leading-none",
    buttonLg:  "text-base font-medium leading-none",
    badge:     "text-xs font-semibold uppercase tracking-wide leading-none",
    planTag:   "text-[0.625rem] font-bold uppercase tracking-widest leading-none",
    tooltip:   "text-xs font-normal text-[var(--color-text-inverse)] leading-snug",
    timestamp: "text-xs font-normal text-[var(--color-text-tertiary)] tabular-nums leading-none",
    meta:      "text-xs font-normal text-[var(--color-text-tertiary)] leading-none",
    code:      "text-sm font-mono bg-[var(--color-surface-secondary)] px-1 rounded leading-normal",
    link:      "text-sm font-medium text-[var(--color-text-link)] hover:underline underline-offset-4 leading-none",
    linkSm:    "text-xs font-medium text-[var(--color-text-link)] hover:underline underline-offset-4 leading-none",
  },

  feedback: {
    error:   "text-sm font-medium text-[var(--color-text-error)] leading-normal",
    success: "text-sm font-medium text-[var(--color-text-success)] leading-normal",
    warning: "text-sm font-medium text-[var(--color-text-warning)] leading-normal",
    info:    "text-sm font-medium text-[var(--color-text-link)] leading-normal",
  },

  empty: {
    title: "text-base font-semibold text-[var(--color-text-primary)] leading-snug",
    body:  "text-sm font-normal text-[var(--color-text-secondary)] leading-relaxed",
  },

  modal: {
    title: "text-lg font-semibold text-[var(--color-text-primary)] leading-snug",
    body:  "text-sm font-normal text-[var(--color-text-secondary)] leading-relaxed",
  },

  overflow: {
    truncate:  "truncate",
    clamp2:    "line-clamp-2",
    clamp3:    "line-clamp-3",
    breakWord: "break-words",
    breakAll:  "break-all",
    noWrap:    "whitespace-nowrap",
    preWrap:   "whitespace-pre-wrap",
  },

  srOnly: "sr-only",

} as const satisfies Record<string, Record<string, string> | string>

export type TypographyGroup = keyof typeof typography
export type TypographyKey<G extends TypographyGroup> =
  typeof typography[G] extends Record<string, string>
    ? keyof typeof typography[G]
    : never
