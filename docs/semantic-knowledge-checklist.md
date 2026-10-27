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
