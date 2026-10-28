[English](semantic-e2e-risks-t29.md) | [Português](semantic-e2e-risks-t29.pt-BR.md)

# T29 — Risk-driven semantic E2E regression

The source-of-truth matrix is [semantic-risk-cases.json](../tests/e2e/semantic-risk-cases.json), not a second implementation/admission registry. The nine Playwright cases ([semantic-risk-t29.spec.ts](../tests/e2e/semantic-risk-t29.spec.ts)) exercise the real primitive explorer, deterministic recommendation panel, local typed-confirmation demo and official Pi catalog on **desktop and mobile**. Risk priority reflects the potential for an AI agent to mistake advisory semantics for executable or authorized API surface (P0), or to conflate verified evidence and composition choice (P1).

| Cases | Priority | Traceable origin | What must remain true |
| --- | --- | --- | --- |
| R01 | P1 | AlertDialog `confirm-signal` and `focus-and-keyboard` | Static evidence is not E2E proof or backend authorization. |
| R02–R03 | P0 | AlertDialog `typed-confirmation` / `checkbox-gating` | The *base primitive* lacks these documented capabilities; a separately admitted composite does not silently add primitive props. |
| R04 | P0 | `alert-remote` recommendation | A local confirm event never grants remote deletion; no network effect. |
| R05 | P0 | `alert-typed` / `alert-checkbox` requirements | Unknown and ambiguous requests have no inferred target. |
| R06 | P1 | `button-copy` review-only recipe | A displayed React/Zod proposal itself grants nothing; the authoritative catalog is independent. |
| R07 | P0 | Admission entry, official catalog and certificate | The stable label must match an independently recorded E2E certificate and source digest; otherwise experimental preview requires opt-in. |
| R08 | P0 | Typed-confirmation gap and derived test requirement | Wrong text is disabled, cancel leaves zero confirms and no remote requests. |
| R09 | P1 | `accordion-faq` vs `accordion-members` recommendations | Existing primitive reuse differs from a React-composition proposal. |

The offline verifier [semantic-e2e-t29.test.mjs](../tests/semantic-e2e-t29.test.mjs) cross-checks every risk ID, scenario, source path and relevant capability against `buildSemanticKnowledge().report.semanticCoverage`. This catches orphaned or outdated test provenance. The matrix is not sufficient evidence by itself; browser assertions must pass.

## Run and inspect

```bash
node --test tests/semantic-e2e-t29.test.mjs
npm run semantic:check
npm run semantic:report
npx playwright test tests/e2e/semantic-risk-t29.spec.ts --project=desktop --project=mobile
npm run docs:check
npm run test:offline
```

On PRs into `main`, the existing `quality.yml` **admission-browser** job includes the nine cases alongside existing tests, with no new workflow, write token, or promotion step. Individual `reports/semantic-e2e/{desktop,mobile}/T29-Rxx.json` and screenshots are uploaded in its existing `admission-browser-evidence` artifact, including failure metadata. Each JSON records source, risk, scenario, capability, tested SHA (when set), retry, outcome, matrix SHA-256 and `certification: not-granted`. Browser errors still fail Playwright; reports do not certify contracts. The existing manual `e2e-manual.yml` on `main` picks them up through `npm run test:e2e`; its source-bound certification gate remains unchanged.

Coverage and freshness are independently blocked/reported by the **offline-policy** job using T28's `semantic:check` and `semantic:report`. Inspect the existing `semantic-knowledge-report` artifact and `reports/composition-analysis/semantic-knowledge.json` to reconcile the browser selection with classified gaps. A static implementation needle and an E2E screenshot do not establish all accessibility behavior, remote authorization, or Pi permission.

## Verification record

Execution evidence must be taken from the workflow run and its uploaded artifacts, **not** from the existence of test files. Record the PR check SHA, passed/failed cases per browser, `semantic:check`, `semantic:report`, offline tests and known limitations before approval. A T29 PR based on the T28 development branch includes prerequisite T26–T28 changes until upstream PRs are merged. T20–T24 recommendation/proposal PRs are separate and are not silently merged by these tests; once integrated, extend the matrix with their admission candidates and gap proposals.
