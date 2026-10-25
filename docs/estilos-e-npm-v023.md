[English](estilos-e-npm-v023.md) | [Português](estilos-e-npm-v023.pt-BR.md)

> **Historical record (v0.23):** DNS/npm results describe the environment used for that audit and do not establish current installation or CI status. See [development](development.md).

# CSS and Registry Audit — v0.23

## Files at the time

There is no `application.css` in the project. The central Tailwind/shadcn stylesheet is `src/globals.css` (declared in `components.json`); project-specific styles are in `src/index.css`. The comparison follows the Tailwind 4/shadcn convention of semantic CSS tokens (`:root` + dark mode, `@theme inline`, `@layer base`). We retained `.dark-theme` because existing theme mechanisms and tests depend on that selector; renaming it to `.dark` and migrating everything for purely cosmetic reasons is unnecessary.

## What was removed

- Breakpoint and spacing definitions identical to Tailwind v4 defaults; duplicated light/dark font declarations; unnecessary shadow variables.
- Global code reset, pre-block styling, invisible scrollbar, `cursor: pointer` buttons, relative body positioning across the site, and duplicate `box-sizing` declarations.
- Unused styles from the old shell, sidebar, badges, generic cards, buttons, forms, modals, and pre-shadcn galleries. These competed with official primitives.

## What remains

The custom light/dark OKLCH palette, semantic variables, distinct radii and shadows; `@theme inline`; and custom declarative API adapters: Stack/Grid, Heading/Text, Chart, Metric, Rating, fields, and Pagination. Schemas, templates, contracts, data, gallery structure, and official card layouts were not changed. In a connected run, compare captures of the 64 galleries before/after with the same fonts and viewports.

## Results actually obtained in that sandbox

`node sandbox/registry-probe.mjs` tried three HTTPS npm registries. All failed because of DNS/timeouts. Without cached packages, no `npm install`, `tsc`, Vite build, or Playwright rendering was performed. `npm run test:offline` and dependency-free checks can run and should be repeated after changes. See `reports/sandbox/npm-registry-probe.json` for errors and `sandbox/README.md` for networking alternatives.

**Do not claim visual fidelity** until real captures are obtained with official dependencies and compared against shadcn previews.
