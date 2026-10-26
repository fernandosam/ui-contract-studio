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

The main-branch `E2E manual (main)` workflow clears prior browser evidence, runs the full E2E suite, checks all ten required TypedConfirmationDialog desktop/mobile cases, and publishes the post-E2E artifact. On success it runs `npm run admission:certify`, restricted to manual main-branch GitHub Actions with an explicit environment confirmation. The certificate records the source fingerprint, tested commit, evidence digest and GitHub Actions run ID.

The workflow updates `src/ui-catalog/admission-engine/certifications.json` and regenerates `pi-catalog/contracts.json`, then commits those records to `main` using the workflow token. If repository protection forbids the bot push, the certification commit will fail closed and must be integrated using the repository's protected review process. No successful certification should be claimed when the commit did not land.

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
