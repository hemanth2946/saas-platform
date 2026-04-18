/* eslint-disable no-restricted-syntax */
/**
 * Spacing design tokens.
 * All padding/gap patterns for the project.
 * Maps directly to CSS variables — never use arbitrary pixel values.
 */

export const spacing = {
  page:         "px-[var(--page-padding-x)] py-[var(--page-padding-y)]",
  pageX:        "px-[var(--page-padding-x)]",
  pageY:        "py-[var(--page-padding-y)]",
  pageMobile:   "px-[var(--page-padding-x-mobile)]",
  gapXs:        "gap-[var(--stack-gap-xs)]",
  gapSm:        "gap-[var(--stack-gap-sm)]",
  gapMd:        "gap-[var(--stack-gap-md)]",
  gapLg:        "gap-[var(--stack-gap-lg)]",
  gapXl:        "gap-[var(--stack-gap-xl)]",
  gap2xl:       "gap-[var(--stack-gap-2xl)]",
  card:         "p-[var(--card-padding)]",
  cardSm:       "p-[var(--card-padding-sm)]",
  cardGap:      "gap-[var(--card-gap)]",
  modal:        "p-[var(--modal-padding)]",
  formGap:      "gap-[var(--form-gap)]",
  formLabelGap: "gap-[var(--form-label-gap)]",
  inputX:       "px-[var(--input-padding-x)]",
  tableCell:    "px-[var(--table-cell-padding-x)] py-[var(--table-cell-padding-y)]",
  tableCellX:   "px-[var(--table-cell-padding-x)]",
  tableCellY:   "py-[var(--table-cell-padding-y)]",
  sectionGap:   "space-y-6",
  sectionGapLg: "space-y-8",
  sectionGapSm: "space-y-4",
} as const

export type SpacingKey = keyof typeof spacing
