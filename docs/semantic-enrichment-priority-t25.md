[English](semantic-enrichment-priority-t25.md) | [Português](semantic-enrichment-priority-t25.pt-BR.md)

# T25 — Automatic semantic enrichment prioritization

**Scope:** advisory prioritization of semantic curation and review to improve AI-agent interface composition. **Inputs:** existing `src/ui-catalog/knowledge/` records, aggregated guidance in `scripts/lib/semantic-knowledge.mjs`, and the versioned ReUI example baseline. **Authority:** none. Scores never admit contracts, grant properties/actions/events, change Zod schemas, or extend Pi permissions.

## Deterministic scoring and audit trail

`rankSemanticEnrichment` in `scripts/lib/semantic-priority.mjs` sums seven bounded integer factors. Weights are fixed: no model calls, randomness, external services, or inferred runtime authorization.

| Factor | Rule | Maximum | Why |
| --- | --- | ---: | --- |
| `reuiExamples` | 0→0; 1–5→4; 6–15→8; 16–30→12; 31+→16 | 16 | Greater potential impact on AI composition from frequently illustrated families. |
| `inboundIntegrations` | 4 per distinct semantic profile referencing this component; capped | 20 | Other compositions rely on correct semantic interpretation of the component. |
| `outboundIntegrations` | 2 per distinct candidate integration; capped | 12 | More composition choices need explicit usage boundaries. |
| `unimplemented` | 3 per `documented-not-implemented` capability; capped | 18 | Prevent agents from assuming undocumented implementation authority. |
| `runtimeReview` | 3 per `runtime-review-required` capability; capped | 12 | Unverified keyboard, focus and browser behavior needs review. |
| `highRiskTests` | 2 per derived `manual-a11y` or `candidate-not-executable` test; capped | 8 | Indicates outstanding scrutiny, not an executed or passing test. |
| `documentationGaps` | No curated overlay +12; draft +6; no agent notes +4; no avoid guidance +4; capped | 20 | Lack of decision rules hinders safe agent choices. |

**Theoretical maximum: 106.** Sort by descending total, then stable lexical component name. Integration edges represent **documented candidates**, not verified runtime dependencies. Example counts are versioned examples, not production usage. The score never uses Pi approval, contract dependency approval or admission state.

Each entry includes `rank`, `score`, per-factor `points`, observable `signals` (example count, integration references, capability IDs and test IDs), `evidenceSources`, `dataCompleteness` and `missingData`. Duplicate integration edges are counted once. Evidence can be traced back to the existing curated overlay.

## Incomplete information

Missing overlays or inventoried fields are explicitly marked `dataCompleteness: "partial"`. Missing capabilities are **unknown**, not assumed to be implemented or confirmed risks; observed risk counts use only documented states. Missing guidance increases the documentation factor alone. This is a review queue, not a contract quality guarantee or a runtime certification. Every proposal remains subject to the existing Admission Engine and human review.

## Validation and output

```bash
node --test tests/semantic-priority-t25.test.mjs
npm run semantic:check
npm run semantic:report
npm run docs:check
```

The existing generated `reports/composition-analysis/semantic-knowledge.json` now includes `enrichmentPriorities.criteria` and `enrichmentPriorities.entries` alongside unchanged semantic profiles. The composition analysis also carries the same field. Audit any rank using `points`, `signals`, and `curatedSource`, then run `semantic:check` to confirm underlying static evidence. Generated reports must not be manually edited or treated as authorization.

**Limits:** thresholds are transparent heuristics, not statistically calibrated risk; documented integrations and examples are not usage telemetry; derived tests are only test plans; static code evidence is not browser, accessibility or E2E certification. Admission policy, Pi APIs and Zod schemas are unchanged.
