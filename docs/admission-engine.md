[English](admission-engine.md) | [Português](admission-engine.pt-BR.md)

# Admission Engine — unified catalog and maturity

The **official Pi manifest** `pi-catalog/contracts.json` uses `schemaVersion: 3` and exactly one `components` collection for all 106 contracts (102 base/extensions and four generated compositions). Every contract declares a `lifecycle` (`stable` or `experimental`), and validation details. Experimental entries include source SHA-256 fingerprints and individual E2E protocols. The previous `contracts`, `experimentalContracts` and `entries` arrays are intentionally **removed**, with no legacy manifest fallback.

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

## Automatic E2E certification

The main-branch `E2E manual (main)` workflow clears prior browser evidence, runs the full E2E suite, checks all ten required TypedConfirmationDialog desktop/mobile cases, and publishes the post-E2E artifact. On success it runs `npm run admission:certify -- --candidate=form-declarative`, restricted to manual main-branch GitHub Actions with explicit confirmation. The certificate records the source fingerprint, tested commit, evidence digest and GitHub Actions run ID.

The workflow generates `src/ui-catalog/admission-engine/certifications.json` and `pi-catalog/contracts.json` for **only the explicitly selected candidate**, pushes a separate `admission/certify-...` branch and opens a **draft pull request**. It never pushes directly to protected `main`. Manual approval of the generated two-file diff, successful CI and merge are required for the certificate to take effect. The GitHub Actions run prepares evidence but does **not** certify the repository until that PR is merged. A disabled Actions PR-creation permission fails closed: see T36 below.

The certificate is invalidated whenever the React or schema source digest changes. It cannot be transferred to a different candidate, and browser files from an unrelated run are not accepted by the trusted workflow. A certificate is evidence of the tested *local-only UI behavior*, not manual accessibility certification or authority to perform payments, deletion or external requests.

Reviewed recipes: `AcknowledgedActionDialog`, `TypedConfirmationDialog`, `TeamMemberAccordion`, and `CopyFeedbackButton`. All four now have dedicated browser protocols, but **remain experimental until the manual main workflow records matching certificates**. Any failing required browser case blocks that run's promotion; PR test success never means certification.

## Four independent E2E protocols

The existing TypedConfirmationDialog pilot retains its 5 desktop/mobile cases (10 executions). The other candidates now have 3 cases on each platform (18 additional executions): acknowledgment gate/reset/keyboard, local team-member content/keyboard/responsiveness, and clipboard success/denial/keyboard. Evidence reports are separated by candidate under `reports/composition-validation/admission/`.

PR CI runs the browser checks and reports but **does not certify** the stable catalog. Only the manual `E2E manual (main)` workflow may clear old reports, run the full suite on the checked-out commit, verify the required evidence and record source-bound certificates in `main`. The manual workflow has not been triggered by this implementation.

## No legacy admission paths

- `tier` identifies component **origin** (`base`, `extension`, `composition`), whereas `lifecycle` exclusively gates stable versus experimental use.
- The runtime reads Pi v3 maturity; both channel-specific views use one strict Zod validator implementation.
- All four protocols—including TypedConfirmationDialog—share `scripts/admission-evidence.mjs` and require source- and revision-bound proof. Obsolete preview-only approval and promotion aliases were removed.
- Reviewed contracts retain **semantic** fingerprints only. Retired contract inventories can remain as historical records but no longer provide a generation compatibility fallback.
- `content` (semantic field configuration) and `nodeProps` (structured node props) remain distinct, actively used APIs. Removing either would require a dedicated reviewed migration of templates, fixtures and consumers.

## T24 — read-only semantic admission review

The T22/T23 semantic knowledge layer feeds a **diagnostic, non-executable** T24 review through `scripts/lib/semantic-admission-review.mjs`. The bridge rebuilds the audited gaps and proposals from source, compares scenario identities, approved primitive dependencies, existing reviewed recipes, official registry entries, protocol identifiers and the current Pi v3 manifest, then **reuses the authoritative Admission Engine policy gate**. There is no semantic fast path to an allowed scenario, Pi type, schema or E2E certificate.

`npm run admission:check` evaluates the advisory bridge. `npm run admission:publish` also emits `dist/admission/experimental/semantic-review.json` as an **isolated audit sidecar**; the executable `catalog.json` remains governed exclusively by the previous allowlist, generation integrity checks, opt-in channel and source-bound protocols. A semantic proposal may match an **already admitted** experimental contract, but that match is *not* a new admission or activation. Missing allowlist entries, unverified origins, inconsistent targets, missing dependencies, missing reviewed code, or invalid protocols remain blocked. Semantically documented gaps without reviewed scenarios stay unmapped; existing allowlisted recipes without a T23 gap are not automatically revoked or reclassified.

Documented-only semantic candidates (including Combobox, Command and Sheet) are listed as `documentation-only` records without generated recipes, registry entries or activation.\n\nThe report distinguishes `documentation`, `recommendation`, `proposal`, `decision` and the actual `existingPi.lifecycle`. Every review record explicitly denies semantic activation, new Pi publication and E2E certification. Test with `node --test tests/semantic-admission-t24.test.mjs`, `npm run admission:check`, `npm run semantic:check` and `npm run semantic:report`. The two semantic commands retain their T22/T23 advisory outputs; T24 adds no Pi permissions, Zod changes or executable APIs. Browser E2E, independent contract review and trusted manual main-branch certification remain separate obligations.

## T36 — Selective certification through a protected PR

Certification may not bypass the active `main` ruleset. Use **Actions → E2E manual (main) → Run workflow** on `main`, select only **`form-declarative`** and explicitly opt in to `certify_confirm`. Bulk selection or multiple candidates are forbidden. `npm run admission:promote -- --candidate=form-declarative` and `npm run admission:certify -- --candidate=form-declarative` fail outside trusted manual main-branch context, without complete source-bound browser evidence or with a mismatched commit SHA.

The workflow runs the entire E2E suite against one exact revision, clears stale browser evidence, checks independent desktop/mobile protocols, prepares **only** the selected candidate's certificate and creates a **draft pull request** targeting `main`. The PR changes only `src/ui-catalog/admission-engine/certifications.json` and `pi-catalog/contracts.json`; it never writes directly to `main` and never grants Zod props, arbitrary URLs, callbacks, or Pi permissions. A reviewer must inspect the source fingerprint, exact protocol, source-linked evidence hashes, original run URL, local-only operation behavior and the one-candidate lifecycle diff; successful required checks and an explicit decision are prerequisites before readying and merging the draft PR.

**GitHub administration:** enable **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests**. The workflow's GitHub token does not emit normal `pull_request` events when creating the PR, so the job explicitly dispatches the existing `quality.yml` against the proposed branch through `gh workflow run quality.yml --ref <branch>` and the workflow's `workflow_dispatch` entry. The isolated certification job needs `actions:write`, `contents:write` and `pull-requests:write`. PR creation or CI dispatch errors fail closed; no certificate is effective until a reviewed PR passes protected checks and is merged.

**Boundary:** the generated UI and associated report cannot serve as independent proof of behavioral correctness; trust the manual source-bound E2E protocol plus human review. Close issue #62 only after the certification PR has actually landed, not merely after this workflow change.
