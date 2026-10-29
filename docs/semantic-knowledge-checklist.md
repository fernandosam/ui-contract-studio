[English](semantic-knowledge-checklist.md) | [Português](semantic-knowledge-checklist.pt-BR.md)

# Component semantic knowledge enrichment checklist (T01)

**Reference overlay:** `src/ui-catalog/knowledge/alert-dialog.json` (AlertDialog). **Procedure reviewed:** 2026-10-26. Semantic guidance is **advisory documentation**. It does not change Zod schemas, Pi contracts/types/permissions, or grant E2E certification.

## Reuse before extending

1. Start with `src/ui-catalog/reui-guidance.json`, `src/ui-catalog/shadcn-guidance.json` and `src/ui-catalog/semantic-contract-guidance.json`. `scripts/lib/semantic-knowledge.mjs` merges these family-level sources with curated per-component JSON files under `src/ui-catalog/knowledge/`; do not duplicate the family material.
2. Check authoritative contracts in `src/ui-catalog/contracts.lock.json`, `src/ui-catalog/catalog.ts`, `src/ui-catalog/extensions/catalog.ts`, and `pi-catalog/contracts.json`. Locate implementation in `src/ui-catalog/extensions/components/` and `src/components/ui/`; distinguish `src/ui-catalog/extensions/composites/` and the separate `src/ui-catalog/admission-engine/` experimental distribution from primitive contract capabilities.
3. Inspect an exact official source, normally `https://reui.io/components/<slug>` (and its `.md` agent reference if accessible), alongside the **actually installed** shadcn variant. For AlertDialog: [ReUI](https://reui.io/components/alert-dialog) and [shadcn Base UI](https://ui.shadcn.com/docs/components/base/alert-dialog). Vendor examples, FAQs and accessibility claims alone cannot prove this project's runtime.
4. Reuse the JSON shape and checks in `scripts/lib/semantic-knowledge.mjs`; do not introduce a competing schema, validator or source of truth.

## Per-component checklist

- [ ] **Identity/provenance:** create `src/ui-catalog/knowledge/<slug>.json` with `schemaVersion: 1`, PascalCase `component`, `language: "pt-BR"`, `status` (`draft` or `reviewed-documentation`), exact official `source.provider`/URL, reviewed sections and `source.reviewedOn` in `YYYY-MM-DD`. Documentation review **never** authorizes runtime/Pi capabilities.
- [ ] **Purpose:** `purpose` identifies the user task or decision, not appearance alone.
- [ ] **Rationale:** `rationale` captures the benefit and risk being mitigated without promising unverified outcomes.
- [ ] **Use / avoid:** `whenUse` and `whenNotUse` specify real situations, constraints and appropriate alternatives (Alert vs Dialog vs AlertDialog).
- [ ] **Agent notes:** `agentNotes` covers installed-vs-vendor behavior, composition, state, accessibility and security; never invent props, handlers, backend actions or Pi permissions.
- [ ] **Capabilities:** each `capabilities` entry has a stable unique `id`, `description`, one of the three states below, `evidence`, and `testRequirements`.
- [ ] **Verifiable evidence:** for every `implemented-static-evidence` entry, use at least one `{ "path": "src/...", "contains": "exact snippet" }` pair and verify both the source text and the claim's scope. The checker only verifies *textual presence*, not runtime execution, quality or authorization. An experimental composite is not evidence for a primitive's Pi API.
- [ ] **Candidate integrations:** use `integrations` entries with `component`, `relationship`, `reason`. Verify actual contract dependencies; suggestions are neither implemented dependencies nor approved Pi types/permissions.
- [ ] **FAQ decisions:** `faqDecisions` (question/guidance) resolves real tradeoffs, including alternative components, risk-proportionate friction, and explicit backend authorization.
- [ ] **Derived tests:** every `derivedTestCases` entry needs a unique `id`, valid `kind`, actionable `description`, and references to existing capability IDs. Include interaction, a11y/keyboard, mobile/visual, and negative cases as appropriate. Use `candidate-not-executable` for unimplemented proposal behavior; never present suggested tests as executed tests.
- [ ] **Scope:** do not change `src/ui-catalog/extensions/catalog.ts`, `src/ui-catalog/catalog.ts`, Zod schemas, `pi-catalog/`, admission or Pi permissions. Functional changes require a separate review.
- [ ] **Traceability:** record the review date, primary source, implementation paths, unverified gaps, commands actually run and their results.

## Capability state vocabulary

| State | Meaning | Evidence |
| --- | --- | --- |
| `implemented-static-evidence` | Exposed by the **target contract** and located in first-party implementation | Nonempty `evidence` with a real `src/` path and literal needle; recommended tests do not equal executed tests |
| `documented-not-implemented` | Documented upstream but **not exposed by the target contract** | Empty `evidence`; planned test `candidate-not-executable` |
| `runtime-review-required` | Requires observing real interaction in a browser, keyboard, screen reader or device | Empty `evidence`; E2E/manual review still pending |

**AlertDialog example:** `confirm-signal` emits `confirm`, without a remote deletion; `typed-confirmation` is not a capability of the base AlertDialog, despite an independently implemented experimental composite; `focus-and-keyboard` needs runtime review. With Base UI, `AlertDialogAction` is an ordinary button and the local adapter closes the dialog state explicitly.

## Execution and definition of done

1. Review family guidance, primary documentation, actual contract and actual implementation; create a curated overlay only if it adds actionable per-component knowledge.
2. Write the overlay in Portuguese, cross-check the implementation claims and link each derived test to its capabilities. Preserve implementation gaps.
3. Run from the project root:

   ```bash
   npm run semantic:check
   npm run semantic:report
   npm run docs:check
   npm run test:offline
   ```

4. `semantic:check` rejects stale/missing code needles, incorrect names, invalid provenance and bad IDs. `semantic:report` validates again and writes the **derived** `reports/composition-analysis/semantic-knowledge.json`. Review `profiles`, `implementationGaps`, `integrationCandidates`, and `coverage` without treating advice as permission. For a focused read use `npm run semantic:context -- --component=AlertDialog`.
5. Document what truly ran and any limitations in the PR. Neither documentation approval nor static testing replaces browser E2E or stable admission. Do not manually edit generated reports or Pi contracts to make checks pass.

**T01 done:** AlertDialog compared against original sources and local code; checklist committed and linked from documentation index; `semantic:check` and `semantic:report` run with real results; no Zod schema or Pi permission modifications.

## T26 — One auditable semantic coverage report (2026-10-27)

`npm run semantic:check` validates the curated sources and literal `src/` code needles without writing a report. `npm run semantic:report` reruns validation and writes the **same existing** derived file, `reports/composition-analysis/semantic-knowledge.json` (gitignored); it does **not** generate a second coverage report. The `offline-policy` CI job runs both commands and `tests/semantic-coverage-t26.test.mjs` is part of `npm run test:offline`.

Inspect `semanticCoverage` in the generated JSON:

- `sourcePaths` identifies the versioned ReUI baseline, family guidance, overlays and `profiles[].capabilities[].evidence[]` holding literal `path`/`contains` evidence. `reuiExampleProfiles[]` maps inventory example IDs to real source paths.
- `totals` distinguishes families and components with curated overlays from guidance-only profiles, and separates **static-code-evidenced**, **documented-not-implemented**, and **runtime-review-required** capabilities. `implementationGaps` counts only not-implemented capabilities; `insufficientRuntimeEvidence` counts runtime-review-required capabilities. Neither is an authorization metric.
- `families[]` is indexed by **real** ReUI inventory/guidance families and provides sorted `inventoryExampleIds`, exact counts and overlay paths; missing overlays are **documentation gaps**, not proof of missing implementation. Separate overlays such as AlertDialog do not invent ReUI inventory families.
- `components[]` includes curated and guidance-only profiles. Capability ID arrays resolve back to `profiles[].capabilities[]` for full descriptions, implementation states and exact checked code needles. `piContractListed` only reflects the existing lock; `authorization: not-granted-by-semantic-coverage` never grants an API, permission, or admission.

**Reconciliation baseline (T19, 2026-10-27):** 31 ReUI families, 559 versioned examples, 39 curated overlays (31 families plus eight distinct additional components), 230 static-code-evidenced capabilities, 126 documented-not-implemented and 88 awaiting runtime review. These figures are recomputed, not hard-coded, by T26. The new test verifies every family/example count, component/overlay relation, capability state and literal source evidence against the files, plus CLI regeneration and negative coverage cases. Passing static checks cannot establish E2E behavior, accessibility certification, Pi admission, or permission.

## T27 — Source freshness diagnostics (2026-10-27)

T27 extends **the same** semantic-knowledge pipeline and report. Run `npm run semantic:check` for textual validation and actionable stderr diagnostics; `npm run semantic:report` validates again and writes `reports/composition-analysis/semantic-knowledge.json` with `semanticFreshness.summary`, `semanticFreshness.components[]` and `semanticFreshness.diagnostics[]`. Inspect one component with `npm run semantic:context -- --component=AlertDialog` (includes `codeFreshness` and diagnostics). No separate freshness report, contract snapshot or Pi permission is generated.

Only `implemented-static-evidence` capabilities with literal `src/` evidence participate. Diagnostics link the curated overlay, component, capability ID, source path and exact needle, `source.reviewedOn`, last Git change and the required next action:

- `review-required` (non-blocking): tracked source changed **after** the review day, or the working tree has local edits, even when the asserted code needle still exists. Review the affected behavior and derived tests manually before changing the reviewed date.
- `missing-evidence` (blocking): source is missing/unreadable or the exact code needle disappeared; the existing `validateSemanticOverlay` gate still fails `semantic:check` and prevents publishing a supposedly valid report. Restore evidence or explicitly revise the capability classification; never update it automatically.
- `history-unavailable` (non-blocking uncertainty): literal evidence is still present, but Git history is missing (for example, an unversioned checkout). Do not interpret this as `current`; rerun against a checkout with history.
- `current`: literal evidence exists and no later tracked source change is detected; **not** certification of runtime behavior.

`source.reviewedOn` is an **official-documentation review date**, reused as a conservative day-resolution proxy for code freshness; it is **not** proof of a code review. Same-day edits cannot be ordered from a date alone; the audit does not claim they are validated. File-level change detection can produce false positives for unrelated edits and cannot prove runtime semantics. Review warnings are advisory and do not fail the command or modify state. Missing literal evidence remains a hard failure under the existing validator. `documented-not-implemented` and `runtime-review-required` have intentionally empty evidence and are **not** counted as missing files.

The automated regression suite `node --test tests/semantic-freshness-t27.test.mjs` exercises later committed changes with unchanged needles, deleted files/needles, valid historical evidence, uncommitted changes and unavailable history. Run `npm run semantic:check && npm run semantic:report && npm run test:offline` in a full checkout; the CI `offline-policy` job repeats this validation. Report actual command/check outcomes in the PR; never mistake the generated artifact or a static pass for E2E, contract admission or Pi authorization.

## T28 — CI semantic-quality gate and retained evidence (2026-10-27)

The existing [quality workflow](../.github/workflows/quality.yml) runs semantic checks in its **Source, docs and offline tests** job on pull requests and pushes to `main`. It uses the same T26/T27 commands and **does not create a separate workflow**:

```bash
npm run semantic:check
npm run semantic:report
node scripts/semantic-ci-summary.mjs
npm run docs:check
npm run test:offline
```

`semantic:check` remains the blocking gate for incomplete records, missing code files and missing literal evidence. `semantic:report` runs **even when the check fails**, preserving the existing `reports/composition-analysis/semantic-knowledge.json` output path. A failed report is explicitly tagged `validation: { status: "failed", errors: [...] }` and still exits nonzero; **it is a diagnostic artifact, not a validated semantic report**. A successful report retains the original format. `review-required` (code changed after the review date) and `history-unavailable` are advisory and do not grant implementation status or authorization.

Every run uploads the **`semantic-knowledge-report` artifact** (the JSON plus `semantic-check.log` and `semantic-report.log`) with 14-day retention and adds a GitHub job summary listing counts, blocking errors and actionable overlay → component/capability → code evidence diagnostics. Both commands use Bash `pipefail` so logging cannot mask real failures. The existing docs/offline tests, source checks, build, admission and manual E2E gates remain independent.

To reproduce the regression cases run `node --test tests/semantic-ci-t28.test.mjs`. It exercises **valid**, **incomplete**, **changed-but-present** and **missing-evidence** fixtures against the actual analyzer CLI; `npm run test:offline` includes these cases. Use a full-history checkout (`fetch-depth: 0`) when auditing timestamps. Do not update review dates, schemas, Pi permissions or admission states merely to silence a warning.

## Current operational checkpoint — 2026-10-29

This checklist remains the **source format for each overlay**, not a separate approval flow. The current `main` semantic CLI already includes T25 ranking (`enrichmentPriorities`), T26 coverage (`semanticCoverage`), T27 freshness (`semanticFreshness`), T31 Zod/Pi conformance (`semanticConformance`) and curated test recipes (`semanticTestAutomation`). Read live report values; historical T19 counts above are a dated baseline, not current pass criteria.

After reviewing an overlay, verify the *actual local adapter and contract*, the precise `path`/`contains` wiring for each implemented capability, and the distinction between the three capability states. `source.reviewedOn` refers to upstream documentation review: **do not move the date merely to silence a freshness warning**. Review `contractBindings` for existing props/events and `decision` for proposed gaps; no documentation can grant a new API. A `derivedTestCases[].automation` recipe is registered, not executed, until its Playwright result exists; partial tests do not establish complete accessibility or visual fidelity.

Run `npm run semantic:check`, `npm run semantic:report`, `npm run docs:check` and `npm run test:offline` and record *actual* results and source SHA in the PR. The report command produces the primary ignored `semantic-knowledge.json` plus derived `semantic-capability-gaps.json` and `semantic-composition-proposals.json` in `reports/composition-analysis/`. Treat a report with `validation.status: "failed"` as invalid. Existing CI blocks invalid semantic evidence; browser behavior and any stable contract publication remain under their existing independent controls. The current [semantic workflow](semantic-enrichment-workflow.md) and [read-only semantic catalog discovery](semantic-catalog-discovery.md) explain review and user-facing limitations.
