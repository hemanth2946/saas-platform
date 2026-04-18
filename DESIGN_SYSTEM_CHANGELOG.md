# Design System Changelog

## [1.0.0] — 2026-03-23

### Added

#### Token Architecture
- Complete 3-layer token architecture: primitive → semantic → component
- Primitive palette tokens: gray/blue/green/red/orange/yellow/purple/amber scales in `app/globals.css`
- Semantic text tokens: `--color-text-primary/secondary/tertiary/disabled/inverse/link/error/success/warning`
- Semantic surface tokens: `--color-surface-page/primary/secondary/tertiary/inverse`
- Semantic border tokens: `--color-border-default/strong/focus/error/success`
- Semantic interactive tokens: `--color-interactive-primary/hover/active/danger/danger-hover`
- Status tokens (success/warning/error/neutral/info): surface/text/border triplets
- Severity tokens (critical/high/medium/low/info): surface/text/border/dot quads
- Role tokens (superadmin/admin/member/viewer): surface/text/border triplets
- Plan tag tokens: pro and growth variants with custom brand colors
- Typography scale primitives: `--font-size-100` through `--font-size-800`
- Layout dimension tokens: topbar, sidebar, right-panel, content, page padding
- Component dimension tokens: input heights, card padding, modal widths, touch target
- Stack gap tokens: xs through 2xl
- Motion tokens: fast/normal/slow transitions, sidebar/panel transitions
- Focus ring tokens, z-index tokens (backdrop 500 < modal 600 < toast 700 < tooltip 800)
- `will-change` performance hints on `.sidebar` and `.right-panel`
- Dark mode variable block (commented — Phase 6 ready, verified WCAG contrast ratios)
- Tailwind v4 `@theme inline` extensions for color/height/width/max-width utilities
- `tokens.json` — W3C Design Token Community Group format for design tooling sync

#### TypeScript Token Constants (`lib/ui/`)
- `typography.ts` — 30+ grouped keys: heading/body/label/table/nav/ui/feedback/empty/modal/overflow
  - All headings responsive (xl sm:2xl pattern)
  - All colors via CSS variables — zero raw Tailwind color classes
  - Every key includes a `leading-*` class
- `spacing.ts` — page/card/modal/form/table/stack gap tokens referencing CSS variables
- `animations.ts` — fast/normal/slow transitions, focusRing/focusRingInset, sidebar/panel animations
- `layout.ts` — dimension tokens: topbar/sidebar/input/modal/content/z-index
- `variants.ts` — global variant maps (severity levels, flag status)
- `lib/ui/index.ts` — single import point for all design system constants

#### CVA Variants (`lib/ui/cva/`)
- `button.variants.ts` — 6 variants (primary/secondary/danger/ghost/outline/link) × 5 sizes
- `badge.variants.ts` — 5 variants (success/warning/error/neutral/info) × 3 sizes + dot option
- `input.variants.ts` — 3 states (default/error/success) × 3 sizes
- `card.variants.ts` — padding/shadow/interactive compound variants
- `alert.variants.ts` — 4 variants (info/success/warning/error) × 2 sizes
- All CVA: colors via CSS variables, min touch target enforced

#### Feature-Scoped Variants
- `features/iam/constants/iam.variants.ts` — userStatus, inviteStatus, roleVariants
- `features/billing/constants/billing.variants.ts` — subscriptionStatusVariants

#### App Shell Layout
- `store/layout.store.ts` — Zustand store for sidebar open/collapse, mobile sidebar, right panel
  - `sidebarOpen` persisted to localStorage; all other state transient
  - Granular selectors: useSidebarOpen, useMobileSidebarOpen, useRightPanelOpen, useLayoutActions
- `components/layout/AppShell.tsx` — 4-zone shell: TopBar + Sidebar + MainContent + RightPanel + BottomBar
  - Theme initialization on mount (prevents flash)
  - Body scroll lock when mobile sidebar open
  - Mobile backdrop overlay
- `components/layout/TopBar.tsx` — 56px fixed header with hamburger (mobile), logo, org switcher placeholder, notifications placeholder, user avatar
- `components/layout/Sidebar.tsx` — collapsible desktop sidebar + mobile slide-in
  - RBAC-gated nav items via `<Guard>`
  - Plan-gated items show PlanTag and are non-navigable
  - Active state via Next.js `usePathname`
  - Role badge at bottom from IAM variants
  - Toggle button (collapse/expand on desktop, close on mobile)
- `components/layout/MainContent.tsx` — flex-1 scrollable content area, mobile bottom-bar offset
- `components/layout/RightPanel.tsx` — slide-over with focus trap, ESC to close, trigger focus restore
- `components/layout/BottomBar.tsx` — mobile-only fixed bottom nav (Dashboard/Scans/Settings)
- `components/layout/index.ts` — named exports for all layout components

#### Primitive Components (`components/primitives/`)
- `Stack.tsx` — flex column/row with gap/align/justify/wrap props
- `Grid.tsx` — CSS grid with responsive column props (cols/smCols/mdCols/lgCols)
- `Container.tsx` — centered max-width container with optional page padding
- `PageHeader.tsx` — title + subtitle + actions + breadcrumb layout
- `Divider.tsx` — horizontal/vertical divider with optional center label
- `Text.tsx` — semantic text with variant/feedback/weight/overflow props
- `Heading.tsx` — semantic heading with level/as props
- `components/primitives/index.ts` — named exports for all primitives

#### Infrastructure
- `lib/theme.ts` — SSR-safe theme switching (getTheme/setTheme/initTheme/useTheme)
- `app/[orgId]/layout.tsx` — wrapped provider tree in AppShell
- `eslint.config.mjs` — `no-restricted-syntax` rules enforcing token usage
- `DESIGN_SYSTEM.md` — 12-section documentation
- `DESIGN_SYSTEM_CHANGELOG.md` — this file
