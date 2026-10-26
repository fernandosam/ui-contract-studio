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
