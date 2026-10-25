---
description: Create a JSON screen restricted to approved contracts, patterns, and v0.12 examples
argument-hint: '<interface description>'
---

[English](ui.md) | [Português](ui.pt-BR.md)

Task: $ARGUMENTS

Follow AGENTS.md and the ui-catalog skill. First search approved patterns in src/ui-patterns; choose and adapt one when possible. Generate only JSON under src/ui-screens, with metadata. Do not change the app shell, React code, tokens, or catalog without a technical need and independent review. Check the relevant schemas, contracts, and validation rules. At the end, describe the actual changes and results observed.

If a new component is indispensable, stop until its full admission is completed, including a Zod schema, React component, registry, manifest, tests, and independent review.

## Public shadcn/ui API — Version 0.9

- For new JSON screens, use **only** the current type names and props in `src/ui-catalog/catalog.ts` and `src/ui-catalog/extensions/catalog.ts`.
- Approved contracts have semantic versions (base v2.0.0). Old props (`Button.variant=primary/danger`, `Badge.text`, `Alert.type/message`, `Dialog.openPath`) are not allowed.
- React components should delegate to official shadcn/ui primitives when available. If no native equivalent exists, document the composition without claiming a nonexistent official API.
- For composed components (`Card`, `Table`, `Tabs`, `DatePicker`, `DataTable`), expose only serializable data, compatible props, and authorized events; **do not** accept JSX/callbacks/HTML/className from JSON.
- `shadcn-plan.json` determines installation dependencies, **not** approved contracts.
- Contract migrations must update schemas, registry, screens, patterns, examples, lock/fingerprints, docs, and tests together.

Example references: use `/?screen=reui`, approved JSON patterns, and examples from `pi-catalog/examples/`. Do not restore the former Galleries 1/2.

## Required Pi v0.18 Workflow

1. Choose up to 25 required types from `pi-catalog/contracts.json`.
2. Run `npm run pi:zod-schema` and `npm run pi:context -- --types=<tipos> --stdout`: use the actual schemas returned.
3. Generate only a JSON spec with `root`, `elements`, and `children: []` on every node.
4. Run `npm run pi:validate -- --file=<spec.json>`; fix JSON Pointers. Do not modify contracts or scripts to bypass errors without review.
5. Review the output before integrating it into the application; visual tests and CI are additional steps.
