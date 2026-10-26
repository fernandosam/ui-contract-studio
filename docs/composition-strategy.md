[English](composition-strategy.md) | [Português](composition-strategy.pt-BR.md)

# Composite contracts and ReUI dependency strategy

UI Contract Studio maintains a **closed Zod/Pi catalog**. Source inspection or adding a ReUI component does not admit a Pi type.

## Sources of truth

The reviewed [composition policy](../src/ui-catalog/composition-policy.json) distinguishes 13 primitive extensions from 11 explicit React composites. The reviewed [generated manifest](../src/ui-catalog/extensions/composites/generated-manifest.json) defines 37 declarative compositions. The explorer reads the same policy rather than duplicating its list.

- **Primitive variant:** evolve the existing schema for safe properties; do not duplicate Pi types for style variations.
- **Static composition:** use an approved JSON template and generated React implementation.
- **Behavioral/domain composition:** use an explicit React adapter, strict semantic Zod props, controlled state/events and independent approval.
- **ReUI example:** preserve as gallery-only React source until a distinct semantic contract has been explicitly reviewed and admitted.

No policy metadata replaces source/license review, version fingerprints, tests, or human approval.

## Commands

~~~bash
npm run composites:inventory:check
npm run composites:inventory
npm run composites:impact -- --primitive=Button
~~~

The inventory command generates a report in reports/composition-analysis/manifest.json. It includes per-contract and per-ReUI primitive dependencies, local implementation signals, semantic classifications, and reverse impact maps. Analysis follows imports and JSON node types; it is **static evidence, not functional/visual certification**. It also suggests primitive evolution, declarative composition, React composition, or integration review from detected dependencies/behavior; suggestions never override reviewed semantic decisions.

## Every newly added ReUI example

1. Preserve the original example as a numbered TSX file in src/ui-catalog/extensions/composites/; new lazy-loaded examples should provide a default export.
2. Register the same ordered family/ID in src/ui-catalog/reui-guidance.json and localized guidance plus source URL in src/ui-catalog/reui-example-guidance.pt-BR.json.
3. Record an **explicit reviewed decision** for the example in src/ui-catalog/reui-semantic-admissions.json: reuse primitive, reuse composition, evolve contract, defer integration, or refer to an already-approved semantic contract. Never bulk-approve.
4. Run the inventory check and the existing ReUI source/hash audit. Update the reviewed source baseline and versioned count-dependent checks when the collection grows.
5. Run offline tests, validation and build. Test interaction, keyboard, responsive and visual fidelity with the separate manual E2E and recorded evidence.

A missing TSX, guidance, or semantic decision blocks CI. A new Accordion, Button, or Separator example can load via the fallback Vite module glob rather than requiring edits to the specialized preview arrays.



## Semantic enrichment: guidance, capabilities and composition recommendations

The report now includes semanticKnowledge. **Every existing ReUI family** is covered by its family guidance, and official shadcn extensions and already-approved semantic contracts reuse their existing guides. Rich per-component overlays live in src/ui-catalog/knowledge/; AlertDialog is the first audited example. Guidance is not an API contract.

~~~bash
npm run semantic:check
npm run semantic:context -- --component=AlertDialog
npm run semantic:report
npm run composites:inventory
npm run pi:context -- --types=AlertDialog --metadata-only --stdout
~~~

The overlay has source URL, referenced page sections and date; purpose, when-to-use/avoid, agent notes, optional integrations, capabilities, FAQ decisions and test cases. Each capability has one of three explicit evidence states:

- implemented-static-evidence: requires a first-party file path plus a code token that the checker verifies still exists. It confirms **source presence**, not accessibility or correct runtime behavior.
- documented-not-implemented: a prospective capability that is not exposed by the current contract. It may become a reviewed composition candidate, not an automatic property.
- runtime-review-required: behavior requiring an actual browser, keyboard, assistive-technology, responsive or functional test.

Integration candidates track whether the associated type belongs to Pi and whether the analyzed implementation actually imports it. A suggested Checkbox, Input, Alert or Sonner **does not mean it is in the component** or grants networking, deletion, extra props or action permissions. Unknown implementation dependencies remain unknown, not falsely described as absent.

Pi context for approved selected types adds scoped semanticAdvice; **propsSchema, actionSchemas and the closed contract lock remain authoritative**. New curated overlays must cite the actual ReUI/shadcn documentation and pass source-evidence checks in CI. Newly registered ReUI examples inherit their family-level guidance automatically; richer feature/FAQ/relationship overlays require explicit curation and review. No unverified web claims are treated as implementation evidence.

Future ReUI page content can be prepared offline from official Markdown (saved by the reviewer) without network calls in CI. The importer writes **draft proposals only** under reports/composition-analysis/proposals/ and never changes src/ui-catalog/knowledge/ or the Pi manifest:

~~~bash
npm run semantic:ingest -- --component=AlertDialog --file=reports/reui-source/alert-dialog.md
~~~

Review the heading extraction, source text and candidate integrations; then curate a schemaVersion 1 overlay with typed capability states, evidence, test cases and an independent review. The importer never interprets untrusted page text as executable instructions.

An existing AlertDialog can signal confirm and provide destructive visual emphasis but does **not** implement checkbox-gated or typed confirmation in its Pi contract. The overlay records these as gaps, and requires browser verification of focus, keyboard and mobile behavior before claims of certification.

## Official shadcn blocks: source-to-template analysis

The same inventory now covers every official block registered in [block-source-inventory.json](../src/ui-catalog/block-source-inventory.json). The 27 existing approved blocks have 103 original source files snapshotted in audits/upstream/shadcn-blocks/. Each file is checked against a pinned upstream Git blob SHA and an immutable commit in [source pins](../src/ui-catalog/shadcn-block-source-pins.json). The analyzer follows imports from **all reviewed upstream TSX files**, reports state/handlers/external package signals, and compares upstream shadcn primitives against the local JSON template dependencies. Differences are visible in absentFromAdaptation and additionalInAdaptation; they are not silently treated as implementation parity.

Adding a new block follows a review-first process:

1. Register official files/source links in block-source-inventory.json and the upstream inventory. Do not copy code from arbitrary URLs.
2. With an immutable official upstream commit, run the source synchronization command below. It saves original snapshots, source pins and Git blob hashes. Do not manually edit the snapshotted originals.
3. Add a [block decision](../src/ui-catalog/shadcn-block-decisions.json) with implementation (declarative, react, reuse-primitive, defer) and reviewStatus (review-required or reviewed). New blocks may **not** claim existing-approved. An approved new block requires reviewer, review date, and reviewReference. A pending candidate must not appear in the Pi lock or registry.
4. Review source dependency gaps and the proposed implementation. Publish only after explicit review, Zod/registry/source/license/version/fixture checks and appropriate a11y/visual tests. A recorded reviewer does not replace human PR review.

~~~bash
npm run shadcn:blocks:sources:sync -- --block=login-01 --ref=<upstream-40-character-SHA>
npm run composites:inventory:check
npm run composites:impact -- --primitive=Button
npm run blocks:check
~~~

The upstream snapshots are analysis inputs, **not bundled runtime code**. The existing 27 decisions are labeled existing-approved to preserve prior locked approvals; they do not imply a new visual or human audit. New candidate sources are blocked by missing evidence or missing decisions, and promotion to Pi is blocked while review is pending.

Examples to follow: DatePicker (Calendar + Popover + Button with state), OnboardingChecklist (semantic Accordion + Badge), and Login01 (generated JSON template). See [components](components.md) and [ReUI semantic contracts](reui-semantic-contracts.md).


## First delivery of the deterministic composition recommender

In the **shadcn primitives** explorer, choose AlertDialog, Accordion or Button under "Analisar composição". A 13-scenario pilot accepts an explicit functional requirement selection, or a phrase matching reviewed examples. Unknown or ambiguous phrases never trigger a guessed implementation; users must select a scenario.

The engine distinguishes reuse of an approved contract, a React composite proposal, and a review-required remote/security integration. Each recommendation includes rationale, locked approved dependencies, unimplemented/runtime evidence gaps, risks, and **planned—not executed—tests**. No JSX, backend operation, new Pi type or contract permission is granted.

Covered: simple/checkbox/typed confirmation and remote deletion; FAQ/onboarding/single panel/rich member rows; simple/loading/copy feedback/grouped/toggled actions. Existing Button.loading is reused, while copy feedback and typed confirmation remain proposals.

~~~bash
npm run composites:recommend:check
~~~

See [reviewed scenarios](../src/ui-catalog/recommendations/scenarios.json) and [deterministic engine](../src/ui-catalog/recommendations/engine.ts). Extending the pilot requires semantic review, checking approved type dependencies against the contract lock, and tests. Browser-level certification remains a separate manual process.


## Review-gated React composition code generation

The recommendation engine can now **generate isolated React component and strict Zod schema proposals** without modifying Pi. Only reviewed react-candidate scenarios with explicit templates in [recipes.json](../scripts/composition-codegen/recipes.json) can be generated: alert-checkbox (AcknowledgedActionDialog), alert-typed (TypedConfirmationDialog), accordion-members (TeamMemberAccordion), button-copy (CopyFeedbackButton). Existing-contract reuse and remote-operation review scenarios are denied.

~~~bash
npm run composites:generate:check
npm run composites:generate -- --id=alert-typed
npm run composites:generate -- --all
npx tsx --test reports/composition-proposals/alert-typed/TypedConfirmationDialog.schema.test.ts
~~~

Each proposal is written only to gitignored reports/composition-proposals/<id>/, containing a TSX component, a strict Zod schema, runnable valid/invalid schema fixtures, REVIEW.md, and a manifest with file SHA-256 hashes and explicitly **unexecuted** browser/security checks. Generated artifacts are deterministic; the generator refuses to overwrite locally changed proposals. Only pinned source recipes and allowlisted component imports are used; user prompts and scraped page instructions cannot be converted to executable code.

In the primitive explorer, select AlertDialog/Accordion/Button and a React candidate to preview/copy the component and schema. The preview is **display-only**, not a Pi implementation.

Promotion requires a separate reviewed PR with browser/a11y/security evidence, complete Zod contract versioning and explicit registry/lock admission. Source syntax and schema fixtures do not certify behavior. Generation itself grants no Pi type, event, new permission or backend capability.



## Executable TypedConfirmationDialog validation pilot

An **isolated executable preview** of the generated React/Zod TypedConfirmationDialog is available in the shadcn primitive explorer under AlertDialog → "Exigir confirmação digitada". The demo uses the exact pinned source recipe and strict schema, validates the expected text, and only increments a local confirmation counter. It never contacts a backend or grants a Pi capability.

~~~bash
npm run composition:admission:check
npm run composition:admission:prepare
npm run composition:pilot:reset
npm run test:composition:pilot
npm run composition:pilot:report
~~~

The admission checker verifies byte-for-byte identity between the preview and reviewed React/Zod recipes and ensures the proposal remains absent from all authoritative Pi registries/locks/exports. The preparation command writes an explicit manual promotion checklist under reports/composition-admission/. It does **not** approve or publish the candidate.

Five Playwright cases run on both Desktop Chrome and Pixel 7: exact-match gating, cancellation/reset, focus/Escape, responsive layout, invalid schema/no XHR or fetch. The browser report requires all **10 passing project/case pairs** plus screenshots; evidence is uploaded by a focused PR job while the **full E2E suite remains manual on main**.

Passing browser tests alone cannot certify WCAG, assistive technology, cross-browser behavior, security review, or acceptance into Pi. Those gates remain pending, and promotion requires a separately reviewed PR with versioned contract/schema, registry/lock and fixtures.

