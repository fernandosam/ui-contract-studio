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

The inventory command generates a report in reports/composition-analysis/manifest.json. It includes per-contract and per-ReUI primitive dependencies, local implementation signals, semantic classifications, and reverse impact maps. Analysis follows imports and JSON node types; it is **static evidence, not functional/visual certification**.

## Every newly added ReUI example

1. Preserve the original example as a numbered TSX file in src/ui-catalog/extensions/composites/; new lazy-loaded examples should provide a default export.
2. Register the same ordered family/ID in src/ui-catalog/reui-guidance.json and localized guidance plus source URL in src/ui-catalog/reui-example-guidance.pt-BR.json.
3. Record an **explicit reviewed decision** for the example in src/ui-catalog/reui-semantic-admissions.json: reuse primitive, reuse composition, evolve contract, defer integration, or refer to an already-approved semantic contract. Never bulk-approve.
4. Run the inventory check and the existing ReUI source/hash audit. Update the reviewed source baseline and versioned count-dependent checks when the collection grows.
5. Run offline tests, validation and build. Test interaction, keyboard, responsive and visual fidelity with the separate manual E2E and recorded evidence.

A missing TSX, guidance, or semantic decision blocks CI. A new Accordion, Button, or Separator example can load via the fallback Vite module glob rather than requiring edits to the specialized preview arrays.

Examples to follow: DatePicker (Calendar + Popover + Button with state), OnboardingChecklist (semantic Accordion + Badge), and Login01 (generated JSON template). See [components](components.md) and [ReUI semantic contracts](reui-semantic-contracts.md).
