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
