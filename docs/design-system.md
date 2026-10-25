[English](design-system.md) | [Português](design-system.pt-BR.md)

# Design System — ui-contract-studio (v0.4)

## Theme

- Source of truth: **`src/globals.css`**, with the supplied OKLCH palettes for light (`:root, .light-theme`) and dark (`.dark-theme`) modes.
- Base: shadcn/ui `base-vega`, Tailwind CSS v4, Lucide icons, and 0.5rem base radius.
- Typography: **Inter** for the interface, **JetBrains Mono** for technical data, and **Playfair Display** available for editorial content. Fonts are served locally through Fontsource.
- The palette is neutral/warm with earthy chart variations, not identical to Vercel's monochromatic palette.
- `@theme inline` uses explicit font stacks instead of `--font-sans: var(--font-sans)` to avoid circular references; original shadows are defined by the theme and consumed by components.
- Old code referencing Geist was replaced with the font set defined in the theme.

## Visual rules

- New components use `--background`, `--card`, `--popover`, `--primary`, `--accent`, `--muted`, `--border`, `--ring`, `--chart-1..5`, `--sidebar-*`, and `--shadow-*`.
- `src/index.css` contains local CSS for the shell and existing renderers. New styles should be scoped to their component, preferably with Tailwind/tokens, without introducing a parallel palette.
- The shell (menu, navigation, header, theme) is fixed infrastructure and not part of the generatable catalog.
- Prioritize contrast, keyboard interaction, responsiveness, visible focus, and tabular numerals in metrics.

## Admission

- The available set is **41 base types + approved extensions**.
- Extensions live under `src/ui-catalog/extensions/`, with a **Zod schema**, **React component**, **registry adapter**, **manifest provenance**, and **tests**.
- Building pages with direct JSX is not permitted; all screens remain `json-render` JSON.
- Full process: [admissao-componentes.md](./admissao-componentes.md).

## Incorporating shadcn/ui (v0.5)

- `src/components/ui/` is the exclusive destination for the shadcn CLI; aliases are aligned with Vite/TypeScript.
- Installed components inherit the theme and CSS variables from `src/globals.css`; do not replace them with the CLI's default theme.
- `src/ui-catalog/*` remains the AI contract. To use a primitive in screens, it needs an adapter and, for a new type, a Zod schema and approval.
- The 21 primitives planned at the time, instructions, and installation status are documented in `shadcn-plan.json` and [integracao-shadcn.md](integracao-shadcn.md).
