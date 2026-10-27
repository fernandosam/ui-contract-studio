# T17–T28 — Requirements-driven flexible interfaces

Initial review: 2026-10-27. [Português](flexible-interfaces-t17-t28.pt-BR.md).

## T17 — Baseline analysis

Current approved contracts allow composition of fields, layouts, tables, buttons and dialogs. The Input adapter does not enforce business checks; AlertDialog emits only a local confirmation; demo form actions do not persist data. Documentation alone cannot grant a contract.

`tests/fixtures/requirements-scenarios.json` defines twelve scenarios: eight static local-demo registration variants expected to generate valid specs, and four guarded scenarios (missing persistence decision, unauthorized backend, business validation, and empty fields). `npm run requirements:audit` calculates results; it is not E2E evidence.

## T18/T19 — Semantic foundations

`src/ui-requirements/composition-rules.json` references curated capability IDs without upgrading implementation states. `capabilities.ts` provides a pilot index for AlertDialog, Input, Select, Button and DataTable. Zod and the lock remain authoritative for admission.

## T20/T21/T22 — Requirement discovery

`flows/registration.json` defines questions, defaults and conditions. `schema.ts` checks the format, and `engine.ts` records explicit/default answers and resolves required decisions. Persistence always requires explicit input. The new `/?screen=criador-interfaces` route provides a UI wizard. Only registration is supported in this pilot.

## T23/T24/T25/T26 — Flexible composition

The planner reuses approved Card, Stack/Grid, Input, Button and AlertDialog contracts. The generator builds valid Pi-style JSON without arbitrary JSX or network actions. `behavior.ts` exposes a bounded predicate and value-validation grammar, but **does not inject those rules into the Pi runtime**. Confirmation is local and is not wired to saving. Use `npm run requirements:preview -- --file=reports/requirements/answers.json` for a read-only report/spec, with `{"intent":"registration","answers":{"persistence":"local-demo"}}`.

## T27/T28 — Conformity and scenarios

`verify.ts` checks catalog Zod, graph invariants and static field/confirmation coverage. `npm run requirements:test` and `npm run requirements:audit` exercise 12 scenarios. Native HTML validation requires real browser review; full E2E remains manual on main.

## Explicit limitations and future gates

Business validation, real submission/persistence, production field workflows, multi-step flows and live accessibility are **not implemented** by this pilot. Any new runtime behavior or permissions require separate approved contracts and independent verification. Static passing specs are not complete functional registrations.

```bash
npm run requirements:test
npm run requirements:audit
npm run semantic:check
npm run contracts:check
npm run validate
npm run build
```
