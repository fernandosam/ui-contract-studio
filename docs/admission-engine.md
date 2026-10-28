[English](admission-engine.md) | [Português](admission-engine.pt-BR.md)

# Admission Engine — unified catalog and maturity

The **official Pi manifest** `pi-catalog/contracts.json` uses `schemaVersion: 3` and exactly one `components` collection for all 107 contracts (102 base/extensions and five generated compositions). Every contract declares a `lifecycle` (`stable` or `experimental`), and validation details. Experimental entries include source SHA-256 fingerprints and individual E2E protocols. The previous `contracts`, `experimentalContracts` and `entries` arrays are intentionally **removed**, with no legacy manifest fallback.

## Lifecycle and access

| State | Meaning | Pi use |
| --- | --- | --- |
| Experimental | Strict schema, codegen integrity, catalog policy, CI tests/build; E2E pending | `--channel=experimental` |
| E2E validated / stable for local-only demos | Complete browser evidence on main and a persisted certificate matching the source fingerprint | Both channels |
| Blocked/stale | Failed gates or no longer matching certificate | Not promoted; mismatched certificate reverts to experimental |

The stable channel is **default**; experimental is opt-in. The experimental registry includes executable React adapters from reviewed sources, not merely documentation. No arbitrary JSX, remote operations, open URLs or new action types are admitted.

`components` is the **only** published Pi component inventory; consumers, UI, context selector and tests read it directly. The existing 102 reviewed types and `contracts.lock.json` retain their source-review rules, but not any backward-compatible Pi manifest shape. Their maturity metadata explicitly says `validation.e2e: not-recorded`: inherited stable access does **not** imply an E2E certification run.

## Commands

~~~bash
npm run admission:sync          # regenerate experimental adapters, schemas, fixtures and official Pi manifest
npm run admission:sync:check    # CI drift guard
npm run pi:zod-schema           # export real JSON Schemas for both channels
npm run pi:context -- --types=TypedConfirmationDialog --channel=experimental --stdout
npm run pi:validate -- --file=pi-catalog/experimental-examples/TypedConfirmationDialog.json --channel=experimental
npm run admission:check
npm run admission:evidence:reset
npm run test:admission:candidates
npm run admission:evidence:report
npm run validate && npm run build
~~~

Without `--channel=experimental`, pending contracts are refused by both the context exporter and the Zod spec validator. An existing app can continue to use `catalog` and `registry`; opt-in integrations use `experimentalCatalog` and `experimentalRegistry`.

## Single PR/CI admission for low-risk local components

There is **no extra certificate PR and no manual promotion workflow** for the specifically reviewed local-only `DeclarativeFormFlow`. The same ordinary PR modifies the source-controlled `src/ui-catalog/admission-engine/policy.json` with a SHA-256-pinned `ciAutoAdmit` entry, and regenerates `pi-catalog/contracts.json`. The Pi manifest shows `lifecycle: stable` with `validation.e2e: ci-required`: this is an **explicit CI gate**, not a claim of a persisted manual E2E certificate.

The required `Source checks, schemas and production build` job in `.github/workflows/quality.yml` runs the independent `declarative-form-certification.spec.ts` protocol in desktop and mobile browsers. It clears previous evidence, writes a candidate-scoped evidence report and checks the actual screenshot hashes, protocol, source digest and exact CI commit using `node scripts/admission-engine.mjs --ci-verify`. The existing mandatory offline-policy job checks semantic quality, the allowlisted fingerprint and strict source/contract boundaries. **If any check fails, protected `main` blocks the PR.** Only merging the passing PR makes the candidate available in the stable channel on `main`.

The `ciAutoAdmit` path is deliberately limited to the current no-event, no-network form and its reviewed fingerprint. Unrecognized IDs, source/schema drift, changed events or unsafe/expanded APIs fail closed. New permissions, backend calls, external effects, or different component types are **not automatically admitted**; they need a separate reviewed contract decision. Pre-existing source-bound E2E certificates for other compositions remain valid and untouched.

`E2E manual (diagnostic only)` remains available for a wider independent test run but has **read-only permissions**, creates no PR and writes no certificates. The former `admission:promote` and `admission:certify` commands are retired.

## No legacy admission paths

- `tier` identifies component **origin** (`base`, `extension`, `composition`), whereas `lifecycle` exclusively gates stable versus experimental use.
- The runtime reads Pi v3 maturity; both channel-specific views use one strict Zod validator implementation.
- All four protocols—including TypedConfirmationDialog—share `scripts/admission-evidence.mjs` and require source- and revision-bound proof. Obsolete preview-only approval and promotion aliases were removed.
- Reviewed contracts retain **semantic** fingerprints only. Retired contract inventories can remain as historical records but no longer provide a generation compatibility fallback.
- `content` (semantic field configuration) and `nodeProps` (structured node props) remain distinct, actively used APIs. Removing either would require a dedicated reviewed migration of templates, fixtures and consumers.

## T24 — read-only semantic admission review

The T22/T23 semantic knowledge layer feeds a **diagnostic, non-executable** T24 review through `scripts/lib/semantic-admission-review.mjs`. The bridge rebuilds the audited gaps and proposals from source, compares scenario identities, approved primitive dependencies, existing reviewed recipes, official registry entries, protocol identifiers and the current Pi v3 manifest, then **reuses the authoritative Admission Engine policy gate**. There is no semantic fast path to an allowed scenario, Pi type, schema or E2E certificate.

`npm run admission:check` evaluates the advisory bridge. `npm run admission:publish` also emits `dist/admission/experimental/semantic-review.json` as an **isolated audit sidecar**; the executable `catalog.json` remains governed exclusively by the previous allowlist, generation integrity checks, opt-in channel and source-bound protocols. A semantic proposal may match an **already admitted** experimental contract, but that match is *not* a new admission or activation. Missing allowlist entries, unverified origins, inconsistent targets, missing dependencies, missing reviewed code, or invalid protocols remain blocked. Semantically documented gaps without reviewed scenarios stay unmapped; existing allowlisted recipes without a T23 gap are not automatically revoked or reclassified.

Documented-only semantic candidates (including Combobox, Command and Sheet) are listed as `documentation-only` records without generated recipes, registry entries or activation.\n\nThe report distinguishes `documentation`, `recommendation`, `proposal`, `decision` and the actual `existingPi.lifecycle`. Every review record explicitly denies semantic activation, new Pi publication and E2E certification. Test with `node --test tests/semantic-admission-t24.test.mjs`, `npm run admission:check`, `npm run semantic:check` and `npm run semantic:report`. The two semantic commands retain their T22/T23 advisory outputs; T24 adds no Pi permissions, Zod changes or executable APIs. Browser E2E, independent contract review and mandatory browser CI and reviewed source-bound admission remain separate from semantic advice.

## T36 superseded — no additional approval layer

The previous T36 workflow (manual certification → draft PR → second CI) was removed. The **only routine admission decision for this reviewed local form is the existing required PR CI**. GitHub's current repository setting has `allow_auto_merge=false`: merge still uses the repository's ordinary PR operation after checks, but **no additional reviewer approval or certificate PR** is necessary under the current ruleset. Enable GitHub native auto-merge separately if automatic integration is desired; do not bypass required checks.
