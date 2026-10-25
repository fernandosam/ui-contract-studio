[English](reui-semantic-contracts.md) | [Português](reui-semantic-contracts.pt-BR.md)

# Semantic Contract Layer — ReUI

## Goals and boundaries

The **approved** catalog describes intent, data, and authorized interactions in Zod; the **559 ReUI examples** remain visual/functional references, not 559 Pi types. React registration, previews, and demo examples do not grant permission for HTML, JSX, unrestricted classes, or external side effects.

## Initial classification of 559 examples

`src/ui-catalog/reui-semantic-admissions.json` includes a traceable entry per ID, category, associated contract, status, and justification. The original classification was **conservative and preliminary**, not a manual fidelity audit of every entry:

- **382** examples already associated during the first pass with families sharing primitive contract names: `existing-primitive-variant` / `reused`. Check each variant for capabilities not covered by schemas; do not introduce new types solely for styling.
- **176** examples initially pending were reviewed in this round, with only two newly approved contracts.
- **1** example, `c-accordion-11`: `approved-semantic` / `approved`, associated with `OnboardingChecklist`.

Do not confuse `ReuiAccordion11` (a React pattern with fixed data available in the ReUI library) with `OnboardingChecklist` (a domain contract with configurable, validated data).

## Approved contract: OnboardingChecklist (v1.0.0)

Visual provenance: https://reui.io/components/accordion/c-accordion-11. Implementation: `src/ui-catalog/extensions/components/onboarding-checklist.tsx`. Contract: `extensionDefinitions.OnboardingChecklist` in `src/ui-catalog/extensions/catalog.ts`.

The schema accepts 1–12 steps, each with a unique `id`, `title`, `description`, and `status` (`completed`, `active`, `pending`). Optional `defaultOpenId` must reference an existing step. At most one step may have `active` status. Accordion uses the JSON text and status, without network access, persistence, or arbitrary callbacks.

An independent JSON example, also used as a Pi fixture, lives at `pi-catalog/examples/OnboardingChecklist.json`. The contract appears in the Approved Composites Explorer. Its Zod contract is normative; the example is not a replacement for the schema.

Agent selection metadata in `src/ui-catalog/semantic-contract-guidance.json` contains **when to use**, **when not to use**, **agent notes**, and reference IDs. These are exported to `pi-catalog/contracts.json` (`semanticGuidance`) and exposed through `npm run pi:context -- --types=OnboardingChecklist`.

## Review of 176 pending cases (October 24, 2026)

The `src/ui-catalog/reui-semantic-admissions.json` matrix was reviewed for **176 individual decisions** and records `reviewedOn`, `reviewBasis`, use cases extracted from guidance, and routing justifications. All entries remain traceable to the 559 ReUI records.

| Outcome in this round | Count |
| --- | ---: |
| Variant of an existing primitive | 129 |
| Composition using existing contracts | 22 |
| Gap in existing contract — evolve it, do not create a new type | 15 |
| Potential semantics depending on media/event/authorization policy — not admitted | 8 |
| Newly approved semantic contract | 2 |
| **Reviewed total** | **176** |

The new contracts are:

- **`RatingDistribution`** (ReUI `c-rating-6`): five counts for 1–5 stars, with derived weighted average, percentage, and total; arbitrary percentages in JSON are not accepted. This is not the same as an individual `Rating`.
- **`CharacterCountTextarea`** (ReUI `c-textarea-6`): a local text form with configurable limit, near-limit warning, dynamic counter, and accessibility. It is not a form submission API.

**Explicitly deferred decisions:** `c-rating-9` (review submission without a typed payload or authorized persistence); `c-carousel-9/10` (thumbnail galleries requiring a safe media policy and accessible navigation); `c-dropdown-menu-10/11/14/18` (workspaces, notifications, presence, and models requiring approved sources and actions); `c-button-group-55` (payment capture/release requires transactional authorization).

**Gaps in existing contracts:** autoplay and advanced rendering in `Carousel`, submenus/advanced selections in `DropdownMenu`, direct navigation and row count in `Pagination`. Evolve existing schemas without duplicating types.

Documenting each example does not automatically certify the implementation of every visual variation; only the new contracts have a dedicated semantic API and are submitted to schema/catalog tests. Examples not admitted remain available as visual references.

## Promotion workflow for other examples

1. Select an example marked `review-required` or a candidate for improving an existing contract and compare its semantics with types in `contracts.lock.json`.
2. Prefer evolving an existing primitive schema for variants without distinct data or behavior. A new contract should represent a distinct domain capability only.
3. Create a strict semantic Zod API, React implementation or approved JSON template, valid independent example, and agent guidance; declare `events` only when necessary and supported.
4. Record license/provenance in `sources.json`, version/fingerprints in `contracts.lock.json`; update Pi manifests and samples.
5. Test valid/invalid values, IDs, states, accessibility, keyboard, light/dark themes, and visuals; do not equate passing a build with visual certification.
6. Review the PR and decision matrix before changing status to `approved-semantic`; never bulk-promote automatically.

## Checks

`npm run test:offline`, `npm run contracts:check`, `npm run pi:api:check`, `npm run pi:fixtures:check`, `npm run validate`, and `npm run build`. E2E remains manual on main but includes new cases for the contract and classification UI.
