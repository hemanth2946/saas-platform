/**
 * Design system — single import point.
 *
 * @example
 * import { typography, spacing, animations, layoutTokens } from '@/lib/ui'
 * import { buttonVariants, badgeVariants } from '@/lib/ui'
 *
 * NOTE: IAM and billing variants are feature-scoped — import directly:
 *   import { roleVariants } from '@/features/iam/constants/iam.variants'
 *   import { subscriptionStatusVariants } from '@/features/billing/constants/billing.variants'
 */

export { typography } from "./typography"
export type { TypographyGroup, TypographyKey } from "./typography"

export { spacing } from "./spacing"
export type { SpacingKey } from "./spacing"

export { animations } from "./animations"
export type { AnimationKey } from "./animations"

export { layoutTokens } from "./layout"
export type { LayoutTokenKey } from "./layout"

export { severityVariants, flagStatusVariants } from "./variants"
export type { SeverityLevel, FlagStatus } from "./variants"

export { buttonVariants } from "./cva/button.variants"
export type { ButtonVariants } from "./cva/button.variants"

export { badgeVariants } from "./cva/badge.variants"
export { inputVariants } from "./cva/input.variants"
export { cardVariants } from "./cva/card.variants"
export { alertVariants } from "./cva/alert.variants"
