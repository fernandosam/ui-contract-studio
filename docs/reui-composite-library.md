[English](reui-composite-library.md) | [Português](reui-composite-library.pt-BR.md)

# ReUI Composite Component Library — ReUI

## Scope

ReUI preserves **559 TSX examples** across **31 ReUI families**. Each example has its own identity as a **reusable React component** (`ReuiAccordion01`, `ReuiButton01`, `ReuiAlert01`, etc.), a strict presentation-props contract, and complete usage metadata. Visual implementation and interactions remain in the original TSX without duplicated logic.

The Composite Component Explorer presents two independent libraries: **Approved Contracts** (the closed json-render/Pi catalog) and **ReUI Compositions (559)** (ReUI React components). Each example offers an **Open composite component** link with ID-based selection.

## Sources of truth

- `src/ui-catalog/extensions/composites/reui-composite-definitions.ts`: manifest derived from two already versioned official sources, `reui-guidance.json` and `reui-example-guidance.pt-BR.json`, including identity, origin, usage, contraindications, and agent notes.
- `src/ui-catalog/extensions/composites/reui-composite-catalog.tsx`: factory for a **named React component per example**, using its corresponding reviewable TSX implementation. External JSX is not accepted.
- `src/ui-catalog/extensions/composites/reui-*.tsx`: individual source code and original behavior of each pattern.
- `src/ui-runtime/reui-composite-explorer.tsx`: browsing, previews, filters, agent guidance, example documentation, and runtime editing of width/alignment.

## Safe contract

The React component has a strict Zod-validated presentation API:

| Property | Allowed values | Default |
| --- | --- | --- |
| `width` | `sm`, `md`, `lg`, `full` | `full` |
| `align` | `start`, `center`, `end` | `center` |

It does not accept `children`, `className`, HTML, arbitrary JSX, arbitrary CSS, callbacks, unrestricted URLs, or configuration of external side effects. Every composition is **an instance of a visual pattern with preserved demo behavior and data**. Exposing editable domain data in a specific composition requires reviewing that pattern and defining safe semantic props, rather than allowing unrestricted changes to the JSX tree.

Example React usage:

~~~tsx
import {
  reuiCompositeImplementations,
} from "@/ui-catalog/extensions/composites/reui-composite-catalog"

const AccordionComposto = reuiCompositeImplementations.ReuiAccordion01

export function MinhaPagina() {
  return <AccordionComposto width="lg" align="start" />
}
~~~

The corresponding component still displays the same questions and answers as the ReUI preview and keeps the **Best for**, **When not to use**, **When to use**, and **Agent notes** recommendations linked to its record.

## Separating components from demos

The CSS container `mx-auto mb-auto w-full max-w-lg` controls only how an example appears in ReUI. It must not become part of the reusable component's JSX: doing so would block configurable width (`width`) and impose unexpected margins when the composition is embedded in real screens.

The 11 Accordion patterns and Alert examples 12–20 now return their semantic root directly (`Accordion`, `Card`, or `Frame`). Original appearance is maintained in the `ReuiPreview` host, which applies the container only to previews.

- `ReuiPattern`: mounts the actual component, without gallery margins or width; preserves state, interactions, and lazy example loading.
- `ReuiPreview`: wraps `ReuiPattern` in the demo layout and provides attributes used by ReUI tests.
- `ReuiComposite`: uses `ReuiPattern` directly; contract-defined `width` and `align` are the only outer positioning layer.

Do not remove internal structural containers (for example `Frame`, `AccordionItem`, or groupings required for interaction, accessibility, or visual identity). Extract a container only after confirming its classes belong exclusively to the *demo host*.

## Boundary for admission to the Pi catalog

**The ReUI library does not automatically change the 102 approved json-render/Pi contracts.** This is intentional and follows `docs/admissao-componentes.md`: some ReUI entries are merely variants of equivalent primitives (e.g., a standard button), for which a new Pi type would be redundant. Others are genuine compositions that may deserve their own contracts.

Admitting a composition as a new Pi type requires evaluating equivalence/semantics, modeling explicit data and events via Zod in `extensions/catalog.ts`, implementing a typed adapter and declarative template where feasible, recording provenance/license in `sources.json`, adding accessibility and regression tests, updating the lock with human review, and generating fixtures/manifests. Bulk promotion without review violates project policy.

## Validation

- `tests/reui-composite-library.integration.test.ts`: 559 IDs and unique names, TSX file integrity, fidelity of example information, provenance, strict Zod, and preservation of Pi boundaries.
- `tests/e2e/reui-composite-library.spec.ts`: library switching, ReUI selection, safe editing, recommendation fields, and source code.
- `npm run validate && npm run build`; the E2E suite remains manual on main.

## Semantic configuration pilot (5 patterns)

Five reviewed React examples now accept independently validated **local-only semantic data**, while the other 554 remain layout-only: `c-accordion-1` (bounded FAQ items), `c-alert-1` (text), `c-checkbox-1` (label and initial state), `c-input-1` (placeholder and accessible name) and `c-dialog-1` (profile-form labels and initial data). Edit the JSON in the ReUI composite explorer; invalid JSON or unknown properties prevent preview rendering.

The per-example strict Zod schemas and source-controlled defaults live in `src/ui-catalog/extensions/composites/reui-semantic-config.ts`. The React factory rejects `data` for all other IDs. No arbitrary JSX, CSS, callbacks or remote effects are accepted. These examples **are not added to the Pi catalog or auto-admitted by the Admission Engine**: they remain explicit candidates for subsequent individual review. ReUI Gallery 3 keeps the upstream demo defaults unchanged. CI integration tests cover schema acceptance/rejection; browser interaction requires the manual E2E workflow.
