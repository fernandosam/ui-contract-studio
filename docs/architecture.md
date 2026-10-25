[English](architecture.md) | [Português](architecture.pt-BR.md)

# Current Architecture

UI Contract Studio combines React with a **closed** catalog of JSON-renderable elements validated by Zod. Agents may generate specs but must not define arbitrary components, code, URLs, or side effects.

## Sources of truth

| Responsibility | Source |
| --- | --- |
| Base/extension schemas | `src/ui-catalog/catalog.ts` and `src/ui-catalog/extensions/catalog.ts` |
| Registry and adapters | `src/ui-catalog/registry.tsx` and `src/ui-catalog/extensions/registry.tsx` |
| Contract version, integrity, and status | `src/ui-catalog/contracts.lock.json` |
| Provenance, license, and declared review | `src/ui-catalog/sources.json` |
| Published agent API | `pi-catalog/contracts.json` |
| Retired types | `pi-catalog/retired-contracts.json` |
| Screens and patterns | `src/ui-screens/` and `src/ui-patterns/` |
| Static compositions | `src/ui-catalog/extensions/composites/templates/` |
| shadcn/ui source plan | `shadcn-plan.json` |
| ReUI examples | `src/ui-catalog/extensions/composites/reui-composite-definitions.ts` |

In snapshot 0.24.0, the lock and Pi manifest list **102 active contracts** (41 base and 61 extensions). The shadcn/ui plan includes **50 planned/local primitives**, and ReUI contains **559 React examples**. These inventories are independent: installing a primitive or creating an example does not add a Pi contract. In future releases, consult the underlying files instead of assuming these counts still apply.

## Responsibilities

1. **Primitives:** shadcn/ui implementations in `src/components/ui/` and ReUI components do not automatically authorize their use in a spec.
2. **Catalog:** Zod controls types, properties, slots, events, and actions; adapters implement only approved capabilities.
3. **Compositions:** JSON templates, the `generated-manifest.json` manifest, and derived code under `src/ui-catalog/extensions/generated/`. Never edit generated output. Stateful behavior requires explicit React code.
4. **Runtime:** `src/ui-runtime/` provides explorers and rendering; the composition registry is passed through context.
5. **Pi Agent:** selected context and examples in `pi-catalog/`, with spec validation before use.

`content` and `nodeProps` edit authorized values only: they cannot replace types, tree structure, URLs, handlers, actions, or field identity. Versions/fingerprints and `status: approved` document technical integrity, **not human approval**. Login, payment, and remote-access demos do not provide production services.

See [components](components.md), [agents](agents.md), [development](development.md), and [governance](governance.md).
