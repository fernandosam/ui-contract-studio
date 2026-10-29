[English](design-token-inventory.md) | [Português](design-token-inventory.pt-BR.md)

# PHASE 3 (E06) — Inventory of existing visual tokens

**Snapshot:** October 29, 2026. This is a **source inventory**, not a new design-token API. The exhaustive machine-readable [design-token-inventory.json](design-token-inventory.json) records every light/dark color and shadow value. Run `node scripts/inventory-design-tokens.mjs --check` to detect drift, `--write` to regenerate, or run without flags to print the current JSON.

## Sources and classification

- **Canonical theme:** `src/globals.css`, selectors `:root, .light-theme` and `.dark-theme`, with Tailwind CSS v4 `@theme inline` aliases; `components.json` selects this file, `base-vega` / `neutral`.
- **Local styles:** `src/index.css`, limited to the `pg-*` catalog adapters.
- **Actual component references:** `src/components/ui/{button,input,card}.tsx`, `src/ui-runtime/layout.tsx`, `src/ui-requirements/layout-quality.ts`. Fonts are imported in `src/main.tsx`.
- **Kinds:** canonical theme CSS variable; alias mapped to canonical; local adapter value; Tailwind framework utility/scale; component/layout variant. An existing local value is **not** automatically a public theme token.

## Inventory

| Category | Existing values and use |
| --- | --- |
| **Colors** | **32 canonical semantic colors** with explicit OKLCH light/dark values and corresponding `--color-*` aliases. Surfaces: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`. Actions: `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`. Outlines: `--border`, `--input`, `--ring`. Charts: `--chart-1` to `--chart-5`. Sidebar: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`. Two **local** colors, `--success` and `--warning`, have theme values but no `--color-success` or `--color-warning` aliases. |
| **Typography** | `--font-sans` Inter Variable, `--font-mono` JetBrains Mono Variable, `--font-serif` Playfair Display Variable, loaded with Fontsource; `--tracking-normal: 0.01em` plus `--tracking-tighter/tight/wide/wider/widest`. Local headings: h1 `1.875rem/1.2`, h2 `1.5rem/1.25`, h3 `1.25rem/1.3`, h4 `1rem/1.5`; local body/caption/lead `0.875/0.75/1rem`. Component `text-*` utilities are Tailwind-native rather than a new local scale. |
| **Spacing** | Tailwind v4 native `--spacing`-based utilities are inherited, not overridden. Declarative `pg-gap`: `none=0`, `sm=.625rem`, `md=1rem`, `lg=1.5rem`. Grid fallback `1rem`, field gap `.5rem`, placeholder gap `.25rem`. The official Card uses `--spacing(6)` by default, `--spacing(4)` for `sm`. |
| **Borders** | Theme colors `--border`, `--input`, `--ring`. Adapter placeholder `1px dashed var(--border)`; graph and pagination `1px solid var(--border)`. Native shadcn uses `border`, `ring-1` and `ring-3`. No custom global border-width token is declared. |
| **Radii** | `--radius: 0.5rem`; aliases `--radius-sm: calc(var(--radius) - 4px)`, `--radius-md: calc(var(--radius) - 2px)`, `--radius-lg: var(--radius)`, `--radius-xl: calc(var(--radius) + 4px)`. Button uses `rounded-md`, Card `rounded-xl`; some smaller button variants use `min(var(--radius-md), ...)`. |
| **Shadows** | Eight theme variable names: `--shadow-2xs`, `--shadow-xs`, `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-2xl`. `xs` aliases `2xs`; `shadow` aliases `sm`. Each theme has its own values. |
| **Density** | No global `--density` token. Card sizes `default/sm`; Button sizes `default/xs/sm/lg/icon/icon-xs/icon-sm/icon-lg`; Input `h-9`; declarative gaps and column counts; quality evaluator applies separate flow-specific restrictions. |

### Representative color values

`--primary` = `oklch(0.3012 0 0)` in light mode and `oklch(0.8520 0.0205 100.6306)` in dark mode; `--color-primary: var(--primary)` is an alias, not a third palette. Values for **all** colors and shadows are in the JSON snapshot.

### Responsive caveat

`src/index.css` declares grid media queries in this source order: 639px, 850px, 520px. Because the later 850px rule may override the earlier 639px rule, widths 521–639px can have two columns rather than one. This is a **follow-up browser-test risk**, not a verified responsive pass. The CSS comment mentions up to six columns, while the layout-quality evaluator applies stricter limits to its inspected flows; neither is a new Pi permission.

## Maintenance and boundaries

```sh
node scripts/inventory-design-tokens.mjs --check
node scripts/inventory-design-tokens.mjs --write
node --test tests/design-token-inventory.test.mjs
npm run semantic:check
npm run semantic:report
```

The inventory reads named source files, preserving literal CSS values. It does **not** compute browser styles, audit every ReUI class or contrast, prove full component usage, or certify visual fidelity. No visual styles, Zod schemas, admitted contracts, Pi permissions, or Admission Engine controls are modified by E06.
