[English](reui-primitive-coverage-audit.md) | [Português](reui-primitive-coverage-audit.pt-BR.md)

# ReUI Coverage Audit: 31 Families / 559 Local Examples

**Scope:** TSX examples actually versioned in `src/ui-catalog/extensions/composites/reui-<familia>-<n>.tsx`; Zod schemas in `src/ui-catalog/catalog.ts` and `src/ui-catalog/extensions/catalog.ts`; renderers in `src/ui-catalog/components/playground.tsx` and `src/ui-catalog/extensions/registry.tsx`. The collection on the upstream website is dynamic and larger than this local snapshot.

**Evidence:** `src/ui-catalog/reui-primitive-source-baseline.json` contains **559 individual records**, Git SHAs for the files, associated contracts, and example purposes. `scripts/audit-reui-primitives.mjs` reads **all 559 source files**, checks their exact hashes, and derives detailed analysis, including static detection of state, events, inputs, remote media, autoplay, submenus, and multiple primitives.

**Epistemic limitation:** this automated review is **static**. Classifying an example as a basic candidate **does not** prove its functional or visual parity. Keyboard tests, screen readers, actual interactions, snapshots, and upstream comparisons still require verification.

## Classification criteria

- `core-contract-candidate`: basic primitive semantics identified, but **not certified** across all modes and states.
- `approved-composition-candidate`: JSX uses multiple primitives, or the capability can be represented by a composition; do not automatically approve the example as a Pi type.
- `contract-capability-gap`: Zod API/renderer does not express a potential safe capability; consider a versioned extension instead of duplicating types.
- `needs-behavior-review`: state or events require an authorized contract before exposure to Pi.
- `not-admitted-security-or-integration`: unauthorized remote media, permissions, actions, or integrations; keep them outside the catalog.
- `separate-semantic-contract`: the pattern already has its own approved semantic contract; do not duplicate it as a primitive prop.

## Per-family matrix (architectural findings, not certification of every example)

| Family | Examples | Associated contract | Audit direction |
|---|---:|---|---|
| Accordion | 11 | Accordion | Supports textual content, expansion, and indicators. Nested/composed content and onboarding do not fit entirely within textual items; OnboardingChecklist is separate. |
| Alert | 20 | Alert | Alert accepts default/destructive; additional states, icons, and action variants need typed props or compositions. |
| Avatar | 35 | Avatar | Reuse basic avatar; groups, overlays, indicators, and external sources call for composition and media policy. |
| Badge | 25 | Badge | Restricted official variants; additional states and counts attached to controls need safe semantic mapping. |
| Button | 61 | Button | Sizes/variants, allowlisted icons, and loading states partly covered; menus, links, split actions, and custom behavior are compositions. |
| ButtonGroup | 57 | ButtonGroup | The initial contract implements a simple strip and selection, not complex commands, inputs, menus, or workflows; many need controlled composition. |
| Card | 18 | Card | Basic container; composed cards must not accept arbitrary Pi-generated JSX. |
| Carousel | 11 | Carousel | **Concrete gap:** Pi renderer produces textual cards; ReUI patterns include photos, synchronized thumbnails, autoplay, dots, responsiveness, and captions. |
| Checkbox | 22 | Checkbox | Basic state/disabled and events; groups and agreements should compose Field and Checkbox. |
| Collapsible | 10 | Collapsible | Basic disclosure; interactive panels depend on content declared through slots. |
| Dialog | 10 | Dialog | Typed opening and content; internal forms and confirmation actions require event policies and composition. |
| Drawer | 5 | Drawer | Opening and directions covered; complex layouts and variable data are not trigger variants. |
| DropdownMenu | 18 | DropdownMenu | **Concrete gap:** flat item schema does not cover submenus, radio/checkbox, and stateful choices. Account and notification menus require action governance. |
| Input | 31 | Input | Typed text control; attachments, scoped search, icon groups, and sophisticated validation are Field/Input compositions. |
| Pagination | 15 | Pagination | **Concrete gap:** goto, size selector, and first/last were missing; the original renderer capped the numeric list at 30 items. |
| Popover | 11 | Popover | Text content and controlled open state; internal forms and selections need approved structures. |
| Progress | 8 | Progress | Basic numeric progress covered; segmented bars and composed statuses must not become arbitrary CSS props. |
| RadioGroup | 17 | Radio | Radio contract is a list of text options; priced plans, avatar cards, and payment methods are semantic compositions. |
| Select | 33 | Select | Basic options covered; images, search, grouping, and multimodal content need safe extension or a specialized component. |
| Separator | 6 | Separator | Decorative or text-labeled variants call for composition; do not introduce arbitrary JSX into the separator. |
| Skeleton | 10 | Skeleton | Basic placeholder; loading layouts require controlled templates/presentation. |
| Slider | 12 | Slider | Range/step/orientation with event; additional numeric displays and +/- controls need composition. |
| Spinner | 12 | Spinner | Basic indicator; overlays, button loading, loading cards, and bars need composition with a state policy. |
| Switch | 14 | Switch | Boolean state and events; preference rows and descriptions are Field/compositions. |
| Table | 17 | Table | Basic table contains text; sorting, filtering, and selection should use an approved DataTable. |
| Tabs | 9 | Tabs | Typed tab navigation; dynamic panel content and routing require authorized contracts/slots. |
| Textarea | 6 | Textarea | Basic textarea; counter and character limit belong to the approved CharacterCountTextarea contract. |
| Toggle | 14 | Toggle | Pressed state, variant, and size; buttons with badge, icons, and tooltip should be composed. |
| ToggleGroup | 16 | ToggleGroup | Basic single/multiple selection; icons, badges, and rich options require composition or safe properties. |
| Tooltip | 16 | Tooltip | Simple text + direction; icon/custom trigger needs safe composition. |
| Rating | 9 | Rating | **Concrete gap:** original renderer displayed whole stars even for fractional values; aggregated distribution belongs to RatingDistribution. Review submission is a different capability. |
| **Total** | **559** | **31 families** | **Complete source coverage, not complete API equivalence** |

## Identified corrections and priorities

**P1 — partially evolved during this review:** `Carousel` now exposes loop, orientation, arrows, indicators, and responsive density, **without remote media or autoplay**; `DropdownMenu` exposes separators, labels, local checkboxes, and one-level submenus, **without radio selections or domain action groups**; `Pagination` implements a `siblingCount` window, first/last, direct jumps, and items-per-page selector when `totalItems` is known. `Rating` already calculates fractional fill (`ratingStarFillPercent`); fractional interaction tests and visual certification remain pending.

**P2 — reinforce safe semantic compositions:** `Avatar` gained a local presence indicator; `Alert` gained a semantic tone and local dismissal. `ButtonGroup` (input/menu/button combinations), `RadioGroup` (cards/plans/payments), avatar stacks, and alerts with external actions still require typed composition; always reuse primitives before introducing a new contract. Preserve the separate `OnboardingChecklist`, `RatingDistribution`, and `CharacterCountTextarea` contracts.

**Guardrails:** not every example stands alone; many import helper components, demo service images, and local React state. None of this allows Pi to emit arbitrary JSX, external URLs, `className`, authentication, or business handlers. Executing a ReUI visual example does not admit its behavior to the catalog.

## Reproducing the audit

Run:

```bash
npm run reui:audit:check
npm run reui:audit -- --write
```

The first command inspects all sources and verifies versioned baseline hashes; the second generates `src/ui-catalog/reui-primitive-coverage-audit.json` with **one detailed record per example** (extracted signals and coverage decision). The command does not alter Zod contracts or approve types. The audit now also extracts `observedPresentationProps` per example and `observedProps` and `sharedProps` per family (frequency by file, not occurrence). These are heuristic signals from JSX attributes, **not automatic approval**, and must be checked against code before evolving schemas.

**Next certification step:** execute E2E/ARIA tests and visual comparisons against upstream for each variation, review the five `2.1.0` contracts in the PR, and decide separately on authorized local media, radio-selection controls, and other capabilities not yet admitted.
