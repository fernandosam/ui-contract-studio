[English](semantic-contract-conformance-t31.md) | [Português](semantic-contract-conformance-t31.pt-BR.md)

# T31 — Semantic-to-contract conformance audit

Curated knowledge under `src/ui-catalog/knowledge/*.json` describes capabilities and gaps; it is never an API grant. The read-only T31 audit associates every curated capability with code evidence, the reviewed contract lock, the Pi manifest and the generated authoritative Zod JSON Schema.

## Mandatory invocation after every semantic knowledge change

`npm run semantic:check` always invokes the T31 audit from `buildSemanticKnowledge()`. The same check also runs in `semantic:report`, `semantic:context`, and `pi:context`. The existing quality workflow's `offline-policy` job calls `semantic:check` and `semantic:report` for **all PRs and main pushes**, including knowledge-only changes. Do not classify `src/ui-catalog/knowledge/` as prose-only documentation. Local contributors should run:

~~~bash
npm run semantic:check
npm run semantic:report
npm run semantic:context -- --component=AlertDialog
npm run pi:zod-schema
npm run pi:context -- --types=AlertDialog --stdout
npm run contracts:check
npm run pi:api:check
npm run pi:fixtures:check
npm run admission:check
node --test tests/semantic-contract-conformance-t31.test.mjs
~~~

`reports/composition-analysis/semantic-knowledge.json` is the **single canonical report**, now with `semanticConformance.summary`, `components[]`, `entries[]`, `diagnostics[]`, and `errors[]`. Failed validation writes a diagnostic-only report with `validation.status: failed`. Existing CI logs/artifacts and the CI summary include the conformance results.

## Optional reviewed knowledge fields

In `capabilities[]`, `contractBindings` ties a statically verified implementation to the **existing** admitted Zod property or event. The auditor verifies each link against the real generated schema and refuses invented or unauthorized bindings:

~~~json
{
  "id": "confirm-signal",
  "state": "implemented-static-evidence",
  "contractBindings": [{"kind": "event", "name": "confirm"}]
}
~~~

Use `decision` to record a reviewable disposition for a gap. Supported `disposition` values are `retain-primitive`, `evolve-primitive`, `reuse-composition`, `propose-composition` and `out-of-scope`; a nonempty `reason` is required, and composition decisions additionally require a PascalCase `target`. This never approves a proposed component:

~~~json
{
  "id": "typed-confirmation",
  "state": "documented-not-implemented",
  "decision": {
    "disposition": "propose-composition",
    "target": "TypedConfirmationDialog",
    "reason": "Requires a separate contract and admission review."
  }
}
~~~

## Status and enforcement

- `verified-static`: checked local code fragments, **not** runtime certification.
- `verified-schema`: explicitly bound prop/event exists in the generated Zod schema, **not** a new API grant.
- `not-implemented`: remains unavailable; unresolved decisions receive `decision-required` diagnostics.
- `runtime-review-required`: needs browser, keyboard, accessibility, or viewport verification.
- `contract-mismatch`, `not-in-zod-schema`, or `unauthorized-binding`: **blocking**.
- `schema-unavailable`: binding remains unverified; regenerate and review the Zod schema.

Static local behavior does not need a fabricated public prop/event binding. `pi:context` now attaches the audited projection to `selected[].semantic` while retaining the backward-compatible `semanticAdvice` field. `propsSchema`, action definitions, maturity channels, and permissions remain authoritative and unchanged.

The audit **does not automatically implement** capabilities, change React/Zod, bump lock versions, or admit compositions. For AlertDialog, the existing `confirm` event, `confirmVariant` and `size` props are mapped; checkbox gating and typed confirmation remain proposals for independently reviewed composition contracts.
