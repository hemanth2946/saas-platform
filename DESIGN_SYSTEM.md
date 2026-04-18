# Design System

## 1. Overview

This design system provides a single source of truth for all visual decisions in the SaaS platform. It is token-based, dark-mode-ready, and ESLint-enforced. All components consume CSS custom properties — no raw hex values or arbitrary Tailwind classes in component code.

## 2. Token Architecture

Three layers — never skip a layer:

```
Layer 1: Primitive tokens (raw values — globals.css :root only)
  --gray-900: #111827
  --blue-600: #2563eb

Layer 2: Semantic tokens (reference primitives — globals.css :root)
  --color-text-primary:        var(--gray-900)
  --color-interactive-primary: var(--blue-600)

Layer 3: Component tokens (reference semantics — via lib/ui/* constants)
  typography.heading.page → "text-xl font-semibold text-[var(--color-text-primary)]"
  buttonVariants({ variant: "primary" }) → uses var(--color-interactive-primary)
```

**Rule**: Components only touch Layer 3. Layer 1 (primitives) never appears outside `globals.css`.

## 3. Typography Hierarchy

```
heading.page    (xl/2xl, semibold)   ← Page titles, H1
  heading.section  (lg/xl, semibold) ← Section headers, H2
    heading.card   (base/lg, semibold) ← Card titles, H3
      body.default   (sm, normal)    ← Default body text
        body.muted   (sm, secondary) ← Supporting text
          body.subtle  (xs, tertiary) ← Metadata, hints
```

Responsive headings step down one size on mobile (e.g. `text-xl sm:text-2xl`). Body text is always fixed size.

## 4. Typography Usage Rules

- **Never** use raw `text-sm`, `font-semibold`, or `text-gray-900` in components
- **Always** import from `@/lib/ui`: `import { typography } from '@/lib/ui'`
- Apply as: `className={typography.heading.page}`
- ESLint rule `no-restricted-syntax` enforces this automatically
- Exception: `lib/ui/**` files have `eslint-disable no-restricted-syntax` at top

## 5. Responsive Typography Rules

| Category | Behavior |
|---|---|
| `heading.*` | Responsive — one size down on mobile |
| `body.*` | Fixed — always same size |
| `label.*` | Fixed — always same size |
| `table.*` | Fixed — always same size |
| `nav.*` | Fixed — always same size |
| `ui.*` | Fixed — always same size |

Breakpoints: `sm` = 640px, `md` = 768px, `lg` = 1024px

## 6. Line Height Rules

| Context | Token |
|---|---|
| Headings | `leading-tight` or `leading-snug` |
| Body paragraphs | `leading-normal` or `leading-relaxed` |
| UI elements (buttons, badges, labels) | `leading-none` |
| Tooltips | `leading-snug` |

## 7. Text Overflow Rules

| Context | Rule |
|---|---|
| Table cells | Always `truncate` |
| Nav items | Always `truncate` |
| Body in cards | `clamp-2` or `clamp-3` |
| Badges | `whitespace-nowrap` |
| Headings | Never truncate — always wrap |

Use `typography.overflow.*` tokens: `typography.overflow.truncate`, `.clamp2`, `.noWrap`, etc.

## 8. Spacing Rules

- **Never** use arbitrary padding/margin values
- Use `spacing.*` tokens: `import { spacing } from '@/lib/ui'`
- Apply as: `className={spacing.card}`, `className={spacing.gapMd}`
- Page-level padding always uses `spacing.page` or `spacing.pageX`/`spacing.pageY`
- Gap between items always uses `spacing.gapXs` through `spacing.gap2xl`

## 9. Accessibility Rules

- **Min touch target**: All interactive elements must include `layoutTokens.touchMin` (`min-h-[var(--min-touch-target)] min-w-[var(--min-touch-target)]`)
- **WCAG AA contrast**: All text/background combinations meet AA minimum (4.5:1 normal, 3:1 large)
- **Focus ring**: All interactive elements use `animations.focusRing` or `animations.focusRingInset`
- **Decorative icons**: `aria-hidden="true"` on all icon-only decorative elements
- **Icon-only buttons**: Descriptive `aria-label` required
- **Screen reader text**: Use `typography.srOnly` (`className="sr-only"`)

## 10. Dark Mode Rules

Dark mode is **Phase 6** — the architecture is ready but not activated.

- **Never** hardcode colors in components — always use CSS variables
- **Never** use `text-gray-*`, `bg-white`, `text-black` — use semantic tokens
- All component colors reference `var(--color-*)` — dark mode just redefines those variables
- When dark mode activates, uncomment `[data-theme="dark"]` block in `globals.css`
- Test in both themes before merging any UI work (Phase 6+)

## 11. Adding New Tokens

1. **Add primitive** to `:root {}` in `app/globals.css` (raw hex value only here)
2. **Add semantic reference** using the primitive: `--color-my-token: var(--my-primitive)`
3. **Add to** `tokens.json` (W3C format, for design tooling sync)
4. **Add to** `@theme inline {}` block in `globals.css` if a Tailwind utility class is needed
5. **Add to** `lib/ui/typography.ts` or `lib/ui/variants.ts` as appropriate
6. **Document** in `DESIGN_SYSTEM_CHANGELOG.md` under a new version entry

## 12. Future Work

| Item | Phase |
|---|---|
| Visual testing: Storybook + Chromatic | Phase 6 |
| Dark mode activation | Phase 6 |
| Design token sync: Figma Variables + CI pipeline | Post Phase 6 |
| Additional themes / white-label support | Future |
| Automated token validation in CI | Future |
