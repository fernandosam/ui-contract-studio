[English](components.md) | [Português](components.pt-BR.md)

# Components and Contracts

## Independent inventories

| Inventory | Purpose | Source of truth |
| --- | --- | --- |
| **Pi/json-render** | Types permitted in JSON specs | `src/ui-catalog/contracts.lock.json` and `pi-catalog/contracts.json` |
| **shadcn/ui (Base UI)** | Local primitive implementations | `shadcn-plan.json` and `src/components/ui/` |
| **ReUI** | React compositions and visual examples | `src/ui-catalog/extensions/composites/reui-composite-definitions.ts` |

See [composite components](componentes-compostos.md), the [ReUI library](reui-composite-library.md), and [shadcn integration](integracao-shadcn.md). An installed primitive is not automatically a Pi type.

## Admitting a Pi type

1. **Demonstrate a gap.** Search for an approved equivalent and prefer combining existing primitives.
2. **Define the API.** Use a unique PascalCase name and a `z.object(...).strict()` Zod schema in `src/ui-catalog/extensions/catalog.ts`. Declare serializable props and events/slots only when needed.
3. **Implement it.** Stateful behavior requires a React component in `extensions/components/` and a typed adapter in `extensions/registry.tsx`. Static compositions should use a template and generator, not redundant TSX wrappers.
4. **Version it.** Record provenance and license in `sources.json`, version/fingerprint in the lock, Pi examples, and source-derived fixtures. The value `approved` is not proof of independent review.
5. **Test and review.** Cover positive/negative Zod validation, accessibility, states, themes, responsiveness, and side effects when relevant. Run `npm run contracts:check`, `npm run validate`, `npm run build`, and suitable visual reviews. Obtain **human review before** releasing the type.

Agent specs must not contain JSX/HTML, callbacks, arbitrary CSS, unauthorized URLs, or implicit backend permissions.

## Maintaining compositions

Edit templates and `generated-manifest.json` without directly changing `src/ui-catalog/extensions/generated/`. When approved structure changes, regenerate affected files and review contracts, fixtures, and fingerprints:

~~~bash
npm run composites:node-props:generate
npm run composites:generate
npm run composites:generated:check
npm run composites:check
npm run contracts:check
~~~

A template does not permit arbitrary actions/URLs through `nodeProps` or `content`. Verify official sources and captures using the [visual methodology](revisao-visual-shadcn.md). The [shadcn coverage audit of October 23, 2026](shadcn-upstream-coverage.md) is a historical snapshot only.
