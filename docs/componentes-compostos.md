[English](componentes-compostos.md) | [Português](componentes-compostos.pt-BR.md)

# Active Composite Components

The project maintains **37 generated declarative compositions**, including `Dashboard01`, `Login01..05`, `Signup01..05`, `Sidebar01..16`, and 10 demonstration compositions from the shadcn site. Five additional interactive composites have their own implementations.

The Dashboard page was removed from navigation, but the **`Dashboard01` contract and template remain available** at `src/ui-catalog/extensions/composites/templates/block-dashboard-01.json`, with Zod, manifest, provenance, and Pi example. Login, Sign-up, and Sidebars remain navigable blocks.

The former Galleries 1 and 2 and their 54 specific contracts were removed. The **ReUI** gallery remains available at `/?screen=reui`, preserving 559 React compositions and their agent guidance.

## Maintenance and validation

- Schemas: `src/ui-catalog/extensions/catalog.ts`.
- Manifest: `src/ui-catalog/extensions/composites/generated-manifest.json`.
- Versioned contracts: `src/ui-catalog/contracts.lock.json`.
- Templates: `src/ui-catalog/extensions/composites/templates/`.
- Generated compositions: `src/ui-catalog/extensions/generated/`.
- Validation: `npm run check`, `npm run validate`, and `npm run build`.

Do not admit arbitrary JSX, HTML, URLs, callbacks, or actions inside JSON. New compositions must undergo provenance auditing and independent visual review.
