[English](semantic-composition-proposals-t23.md) | [Português](semantic-composition-proposals-t23.pt-BR.md)

# T23 — Semantic-gap composition candidates

T23 reuses the verified T22 audit (`buildSemanticKnowledge().report.capabilityAudit`) and the reviewed recommendation scenarios in `src/ui-catalog/recommendations/scenarios.json`. A proposal is emitted **only if** a reviewed scenario explicitly requires a capability listed as a T22 gap. Other gaps appear in `uncoveredGaps` with an explicit no-inference explanation, not in a fabricated API.

Each `gap-<scenario-id>` proposal preserves the exact origin components/capability IDs, source path, T22 reason and evidence checks, required capabilities, verified static evidence, approved-lock dependencies, implementation limitations, admission limitations, and *planned* tests. The report separates `candidate-review-only`, `runtime-review-required`, `blocked-implementation`, `blocked-evidence`, and `blocked-authorization`. A React candidate is **not executable** before implementation and independent admission. Missing proof is **not** proof of missing code; static evidence is **not** browser certification.

The existing recommender exposes `Recommendation.gapProposals` for its reviewed pilot families and the explorer displays their origins and restrictions. The browser uses curated metadata, labelled *not-verified-in-browser*; the authoritative T22 code-fragment verification runs in the Node `semantic:check` / `semantic:report` flow.

Run `node --test tests/semantic-composition-proposals.test.mjs`, `npx tsx --test tests/composition-recommender.integration.test.ts`, `npm run composites:recommend:check`, `npm run semantic:check`, and `npm run semantic:report`. The latter writes `reports/composition-analysis/semantic-composition-proposals.json` in addition to T22's two reports. Outputs are advisory, never a new Pi spec or implementation.

**Security boundary:** no modifications to `contracts.lock.json`, Pi catalog, existing Zod schemas, admission engine, capability executor, or any permissions. Formal implementation, tests, review and admission remain separate controls.
