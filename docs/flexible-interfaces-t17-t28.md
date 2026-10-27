[English](flexible-interfaces-t17-t28.md) | [Português](flexible-interfaces-t17-t28.pt-BR.md)

# T17–T28 — Requirements-driven flexible interfaces

Initial review: 2026-10-27.

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

## Continuation — T34: requirement traceability (2026-10-27)

`src/ui-requirements/traceability.ts` independently checks links between user answers, component selection, and generated JSON trees for registration, demo login, search, lists and dashboards. Each requirement records an ID, origin (`explicit`/`default`/`derived`), related node IDs, status, and static-only evidence.

`covered-static` means the declared properties/composition were checked; `runtime-review-required` is not browser evidence; `blocked` indicates an unsupported capability or mismatch. Browser test completion is never inferred from static validation.

Dashboard indicator density is now asked only for KPIs, not graphs. No Pi contract or action is added. Both wizards show an expandable traceability section following preview generation.

```bash
npm run requirements:test
npm run requirements:audit
npm run requirements:patterns:audit
```

The CLI emits static evidence only. Playwright evidence requires a separate actual browser run tied to a commit. Authentication, backend persistence, business-rule validation and complete accessibility certification remain outside this change.

## T35 — Declarative form candidate (review: 2026-10-27)

The next phase adds `DeclarativeFormFlow` as a **standalone reviewed React/Zod proposal, not a registered Pi component**. It supports typed unique fields, `required`, `minLength`, `maxLength`, submit/blur validation, single/two-column layout and optional local confirmation. It does not expose remote URLs, callbacks, JSX or persistence.

The registration authoring wizard previews the candidate interactively. The canonical Pi JSON spec still uses only approved contracts. This candidate is **neither an experimental nor a stable admitted Pi contract**, and its local completion does not persist data.

Contract tests and Playwright must precede independent API/admission review. Only a separate approved admission step may change the Pi manifest. T35 still requires that admission and independent accessibility evidence.

Future acceptance: three distinct form variants with the same candidate, strict Zod, browser desktop/mobile, focus/keyboard validation and zero remote actions.

## T35 — Explicit experimental admission (2026-10-27)

The second phase registers `DeclarativeFormFlow` **only in the Pi experimental channel**, through a reviewable recipe, strict Zod schema and source-fingerprint checks in the Admission Engine. Stable Pi remains unchanged. The implementation is local-only with no backend endpoint, remote action, submission or persistence. The `complete` React callback is not exposed as a Pi action.

The authoring wizard now uses `SpecScreen channel="experimental"` to exercise the actual Pi renderer. A serializable example lives in `pi-catalog/experimental-examples/DeclarativeFormFlow.json`; contract checks reject arbitrary properties and stable-channel use.

**Not certified:** `validation.e2e=pending`, no automatic promotion eligibility. Local browser checks and accessibility review are not substitutes for the independent certification via the Admission Engine manual workflow. No backend permission is added.

## T35 — Independent DeclarativeFormFlow browser certification protocol (2026-10-27)

The `declarative-form-desktop-mobile` protocol runs five independent cases on each of desktop and mobile (ten total), recording browser screenshots and structured status under `reports/composition-validation/admission/form-declarative/`, bound to source digest, protocol ID and exact main SHA.

Cases verify required/error focus and ARIA, cancel/Escape/reopen confirmation, Tab/Enter keyboard order, responsive two-/one-column layout with optional inputs, and an explicit no-validation local-only completion. Tests watch for unexpected fetch/XHR requests and check that no data is saved.

Adding `e2eEligible` does **not** certify or stabilize the Pi type. It remains experimental and stable Pi rejects it. Passing PR tests only establishes a provisional runtime review; promotion requires the independently initiated `E2E manual (main)` workflow after PR approval, which rechecks main SHA, resets stale evidence, verifies every desktop/mobile case, and certifies in a separate job. Screen reader accessibility and manual security review remain pending unless independently completed.

Synthetic test screenshots are never production-browser proof. Do not prefill `certifications.json`; source digest, protocol or revision drift invalidates existing evidence.

## T32 — Authorized submission gateway (reviewed 2026-10-27)

\`createSubmissionGateway\` is a **trusted server-only boundary**: a host must explicitly inject allowed services and obtain user, tenant, authorization and CSRF context from a trusted server session. \`defaultSubmissionGateway\` accepts no services. \`createInMemoryDemoService\` is an isolated test fixture accepting name/email only, not production persistence.

The gateway validates payload shape, prevents concurrent duplicates and conflicting reuse of idempotency keys, bounds timeouts with \`AbortSignal\` and returns sanitized adapter errors. **In-memory idempotency and abortion alone are not durable, transactional guarantees.** Production requires a separately approved backend, persistent idempotency, logging, authenticated identity and security review.

No URL/SQL/JS, new Pi permission, browser submission route or remote data operation is added. Tests cover authorized success, conflicts, isolation, timeout, retry and failure. Browser E2E for real persistence remains out of scope without an authorized service.

## T33 — Reuse decisions from the initial request (2026-10-27)

The pattern wizard accepts a short description, detects an unambiguous pattern and only pre-fills choices already declared in \`pattern-flows.json\`. Priority: **explicit selection > conservative inference > documented default**. Requirement reports keep \`explicit\`, \`inferred\` or \`default\` provenance; ambiguous intent requires a manual choice. Hidden conditional questions do not enter the generated spec. \`validateFlow\` rejects duplicates and invalid dependencies.

No model-generated handler, API, remote authentication or additional Pi component is granted. Integration and desktop/mobile browser tests cover these choices.

## T34 — Impact analysis and reproducible static metrics (2026-10-27)

\`npm run requirements:impact -- --changed=src/ui-catalog/knowledge/input.json\` prints a revision-bound impact matrix for registration, login, search, list and dashboard and proposes targeted migration checks for contracts, patterns and referenced semantic documentation. Unknown paths are **explicitly reported** rather than silently interpreted as safe. This mapping is advisory: approval, code review and independent browser tests still govern change admission.

The audit also measures first-pass acceptance on 12 registration and 12 pattern variants: expected blockers remain separate, no new contract types may be inferred, and each accepted static spec has a deterministic SHA-256 fingerprint. The report includes the local Git revision and explicitly marks runtime evidence \`not-imported\`. These are static metrics, **not measured production functionality or proof of live UX testing**. Validation: \`npm run requirements:impact\` and \`npx tsx --test tests/requirements-impact.integration.test.ts\`.

## T33 — Three choices in each pattern (2026-10-27)

Each pattern now declares three bounded UI decisions: login optionally shows access help, lists can show a fictional-data summary, and dashboards can display a data disclaimer. The search flow already has three questions. All variants use existing Text/Card/Table/Metric/Grid contracts. Answers are tracked with provenance and checked against generated nodes. These presentation decisions never enable authentication, remote search, mutations or persistence.

## T34 — Independent source-bound pattern-browser reports (2026-10-27)

Playwright now records four representative pattern previews on desktop and mobile (eight browser results), each with the actual screenshot hash, commit SHA, GitHub run ID, pattern-spec fingerprint and requirement IDs. The focused PR workflow verifies these results in the **same GitHub Actions job** and uploads the artifacts; missing, failed, stale or tampered records fail closed. A result is called \`tested\` only in that verified CI evidence report.

This is not a cryptographically signed artifact or an attestation independent from the workflow. It cannot certify other variants or replace the full manual E2E, authentication, persistence, screen-reader review or stable Pi admission. Outside CI, the audit still reports static-only coverage.
