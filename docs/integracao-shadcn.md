[English](integracao-shadcn.md) | [Português](integracao-shadcn.pt-BR.md)

# shadcn/ui Integration (Base UI) — Current Procedure

UI Contract Studio maintains **local source code** for shadcn/ui components in `src/components/ui/`. The installation plan and versions are in `shadcn-plan.json` and `package.json`; **do not use counts from older plans** as a reference. In the 0.24.0 snapshot, the plan lists 50 primitives and `integration-status.json` reports present sources, but this inventory **does not verify the build**.

## Principles

- shadcn/ui provides React implementations; it does **not** automatically authorize json-render contracts.
- The API available to Pi is defined by Zod schemas and the `pi-catalog/contracts.json` manifest.
- Do not introduce external implementations, theme changes, or dependencies without auditing provenance, licensing, accessibility, and side effects.
- The chosen foundation is **Base UI**, with its style recorded in `components.json`. Do not silently mix different foundations.

## Inspection and installation

~~~bash
npm ci
npm run shadcn:list
npm run shadcn:status
npm run shadcn:verify
~~~

If you need to **add or update** official sources, inspect the preview first and run the installer only in a dedicated branch and a network-enabled environment:

~~~bash
npm run shadcn:preview
npm run shadcn:install
npm run shadcn:verify
npm run validate
npm run build
~~~

The installation script must not arbitrarily overwrite customizations. Any proposed change to `globals.css`, `index.css`, `components.json`, or protected files requires reconciliation and manual review. Installed components must not be presented as compiled or certified solely on the basis of an inventory.

## Admission and tests

To make a primitive available to Pi, follow [components and admission](components.md): strict Zod schema, renderer/adapter, provenance, lock/versioning, fixtures, tests, and independent review. Run structural checks and browser review where available. The [official audit](official-component-visual-audit.md) separates reference capture from visual approval.

**History:** previous plans of 21, 37, and 38 components were snapshots of earlier phases; `shadcn-plan.json` is the current reference, not this document.
