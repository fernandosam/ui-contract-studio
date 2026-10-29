[English](contract-versioning.md) | [Português](contract-versioning.pt-BR.md)

# E07 — Contract versioning and compatibility

## Scope and authority

**SemVer applies per Pi contract**, not to package.json or manifest schemaVersion. The reviewed source is src/ui-catalog/contracts.lock.json (version, semanticFingerprint, stability, status, tier). Fingerprints come from definitions in src/ui-catalog/catalog.ts and src/ui-catalog/extensions/catalog.ts. pi-catalog/contracts.json is a generated projection. Semantic knowledge never grants APIs, permissions or maturity.

## Classification

| Impact | Minimum bump | Examples |
| --- | --- | --- |
| **None** | No bump | Whitespace/comments only; no fingerprint/channel change |
| **PATCH** | 1.2.3 → 1.2.4 | Only literal top-level contract description changes; same API/behavior |
| **MINOR** | 1.2.3 → 1.3.0 | Proven addition of optional props; reviewed beta/experimental promotion to stable |
| **MAJOR** | 1.2.3 → 2.0.0 | Removed/renamed/new required prop; narrower type, enum or range; changed event, slot, nullability or public behavior; stable channel withdrawal; unknown compatibility |

A bump **above**, but never **below**, the minimum is permitted. Only numeric MAJOR.MINOR.PATCH versions without leading zeros or suffixes are accepted, including in the 0.x line. A fingerprint is not a version; a changed hash alone does not prove compatibility. A public change without a bump, or a bump without a public change, is rejected.

### Conservative automated classification

On PRs, npm run contracts:diff compares **the lock AND contract source definitions** against the base commit (CONTRACT_BASE_REF), without executing candidate code. It only automatically proves compatibility for: (1) a literal top-level description change (PATCH) and (2) a pure addition of props ending in .optional() with no other contract change (MINOR). Changes to events, slots, restrictions, types, structural order or anything not proven to be compatible require MAJOR. This is conservative classification, not a claim that every unknown edit is inherently incompatible.

Leaving stability: stable or revoking status: approved requires MAJOR because it withdraws default Pi access. Promotion to stable requires at least MINOR, approval and all existing admission gates. Deprecation does not permit silent deletion; deletion and tier migration remain prohibited. New extension types still require the established admission flow. Documentation never implies admission.

**Limit:** this classifier sees only contract definitions and the versioned lock. It cannot prove adapter/React compatibility, external helper changes, runtime behavior, new capabilities or security policy changes. Those require independent review, proportionate tests and updated versioned definitions when public behavior changes. status: approved in a file is not evidence of human review.

## Pull request procedure

1. Assess and migrate affected JSON screens, patterns, fixtures, adapters, events and Pi consumers.
2. Update authoritative Zod source, reviewed version and fingerprint in lock, synchronize sources.json, and regenerate the Pi projection with npm run pi:api.
3. Run npm run contracts:check, npm run pi:api:check, npm run test:offline, npm run semantic:check, npm run validate and npm run build as available. CI also runs contracts:diff against the exact PR base commit.
4. Record compatibility impact, reasoning, migration and tests in the PR; retain normal independent contract/security review. No extra approval layer or protected-main bypass is added.

SemVer classification is separate from E2E certification, visual audits and new action permissions.

### Granular contract-change evidence

The same `npm run contracts:diff` check now emits `reports/contract-diff/changes.json` for PRs. It compares source definitions at the PR base and head and records **added/removed/modified** changes, with source paths, under `property`, `state`, `event`, `structure` (including slots) and `metadata` (descriptions, channel). Nested literal Zod object shapes use paths such as `props.steps[].status`. The offline tests cover nested states, event and slot member changes, required/optional properties, structural wrappers and opaque expressions.

The JSON includes the base commit, validity, per-category counts, per-component SemVer classification, diagnostics and abbreviated old/new token signatures. It is retained as a CI artifact even when the SemVer gate rejects a change. This is **source-level evidence**, not an execution trace: schemas referenced indirectly from other files, runtime behavior and unsupported/dynamic Zod expressions cannot be proven compatible here. They remain opaque or require independent review. No new approval workflow, API permission or automatic schema promotion is introduced.

## E07 — Consumer impact report

Run `npm run contracts:impact` after `npm run contracts:diff` (PRs pass `CONTRACT_BASE_REF` to the latter). The read-only command consumes `reports/contract-diff/changes.json` and writes deterministic `reports/contract-diff/impact.json` and `reports/contract-diff/impact.md`. Both are kept in the existing `contract-change-audit` CI artifact, including after an invalid SemVer classification when the change JSON was produced. No new approval gate is introduced.

The report links each changed contract to typed nodes in `src/ui-screens/`, Pi examples in both example directories, direct and transitive declarative/React composition dependencies, and reviewed lock versus Pi catalog/schema projection. It captures file and node IDs, dependency chains and explicitly matched property/event paths. Priority is derived from the conservative SemVer classification; every reference to a changed type is potentially affected even when no changed property is explicitly present. Pi projection mismatches are diagnostic, not self-healing.

Static references are not complete runtime coverage. No reference found **does not** mean no consumers exist: dynamic code, external applications and behavior still require review. This report does not modify Zod, reviewed contracts, versions, stability, admission, Pi actions or permissions. Test with `node --test tests/contract-impact.test.mjs`, then run the two contract commands on a PR base.

## E07 — Explicit, deterministic migrations

JSON spec migrations are **opt-in and fingerprint-bound**. They never downgrade, infer compatibility or run automatically in SpecScreen, Pi, or API generation. Reviewed transitions live in `src/ui-catalog/contract-migrations.json`; the authoritative target remains `src/ui-catalog/contracts.lock.json`.

**Supported historical versions:** `Card`, `Badge` and `Input` `2.0.0 → 2.1.0` with exact source fingerprints from historical commit `1fef72c31a42`. Those releases only added optional props (Card: footer; Badge: tone, appearance, size, dot; Input: description, invalid, maxLength), so their explicit migration steps preserve the spec content and update **only the external version manifest**. No other legacy version or fingerprint is assumed compatible.

The external manifest preserves json-render's strict spec schema:

```json
{
  "schemaVersion": 1,
  "contracts": {
    "Card": {
      "version": "2.0.0",
      "fingerprint": "3346cd0cbd754ecae6df29c30575dd826a72814798c97b7a62626a075ac2f9fa"
    }
  }
}
```

**Include exactly every component type used by the spec** with verifiable historical source versions and fingerprints; the example above is partial. Do not fabricate historical metadata for an unversioned spec.

```sh
# Snapshot already-current contract versions
npm run contracts:migrate -- --file=src/ui-screens/blocos-login.json --snapshot --out=reports/contract-migrations/current-versions.json

# Migrate a proven legacy release
npm run contracts:migrate -- --file=tests/fixtures/contract-migrations/legacy-reui-spec.json --versions=tests/fixtures/contract-migrations/legacy-reui-versions.json --out=reports/contract-migrations/reui-migrated.json

# Verify the reviewed migration graph
npm run contracts:migrations:check
```

Without `--out`, prints a deterministic preview and preserves the original. With `--out`, creates the migrated spec, `.versions.json` and audit `.report.json` only under `reports/contract-migrations/`, refusing overwrites. **The real stable-channel Zod validator runs before output is published**, requiring installed dependencies. Unknown versions, mismatched fingerprints, collisions and broken migration chains fail closed.

Future data-only transformations are limited to reviewed `rename-prop`, `rename-event` and `set-default-prop` per exact type/source version, never arbitrary code, type rewriting, actions or permissions. Existing CI/offline checks protect the registry; sensitive changes require ordinary review. Retired or experimental types never become admitted through migration. Review outputs before replacing production consumers.
