[English](admission-engine.md) | [Português](admission-engine.pt-BR.md)

# Admission Engine — unified catalog and maturity

The **official Pi manifest** `pi-catalog/contracts.json` contains `entries`, a unified discoverable inventory combining the original locked contracts and reviewed experimental compositions. Backward-compatible `contracts` remains the original approved/stable set; `experimentalContracts` contains opt-in compositions. Every experimental entry carries a reproducible SHA-256 fingerprint of its React+strict Zod source and explicit permissions.

## Lifecycle and access

| State | Meaning | Pi use |
| --- | --- | --- |
| Experimental | Strict schema, codegen integrity, catalog policy, CI tests/build; E2E pending | `--channel=experimental` |
| E2E validated / stable for local-only demos | Complete browser evidence on main and a persisted certificate matching the source fingerprint | Both channels |
| Blocked/stale | Failed gates or no longer matching certificate | Not promoted; mismatched certificate reverts to experimental |

The stable channel is **default**; experimental is opt-in. The experimental registry includes executable React adapters from reviewed sources, not merely documentation. No arbitrary JSX, remote operations, open URLs or new action types are admitted.

The official `entries` list provides one discovery surface, while the two compatible arrays preserve existing consumers. The original 102 stable types and `contracts.lock.json` keep their established review process and are not silently rewritten. Their maturity metadata explicitly says `validation.e2e: not-recorded`: inherited stable access does **not** imply an E2E certification run.

## Commands

~~~bash
npm run admission:sync          # regenerate experimental adapters, schemas, fixtures and official Pi manifest
npm run admission:sync:check    # CI drift guard
npm run pi:zod-schema           # export real JSON Schemas for both channels
npm run pi:context -- --types=TypedConfirmationDialog --channel=experimental --stdout
npm run pi:validate -- --file=pi-catalog/experimental-examples/TypedConfirmationDialog.json --channel=experimental
npm run admission:check
npm run validate && npm run build
~~~

Without `--channel=experimental`, pending contracts are refused by both the context exporter and the Zod spec validator. An existing app can continue to use `catalog` and `registry`; opt-in integrations use `experimentalCatalog` and `experimentalRegistry`.

## Automatic E2E certification

The main-branch `E2E manual (main)` workflow clears prior browser evidence, runs the full E2E suite, checks all ten required TypedConfirmationDialog desktop/mobile cases, and publishes the post-E2E artifact. On success it runs `npm run admission:certify`, restricted to manual main-branch GitHub Actions with an explicit environment confirmation. The certificate records the source fingerprint, tested commit, evidence digest and GitHub Actions run ID.

The workflow updates `src/ui-catalog/admission-engine/certifications.json` and regenerates `pi-catalog/contracts.json`, then commits those records to `main` using the workflow token. If repository protection forbids the bot push, the certification commit will fail closed and must be integrated using the repository's protected review process. No successful certification should be claimed when the commit did not land.

The certificate is invalidated whenever the React or schema source digest changes. It cannot be transferred to a different candidate, and browser files from an unrelated run are not accepted by the trusted workflow. A certificate is evidence of the tested *local-only UI behavior*, not manual accessibility certification or authority to perform payments, deletion or external requests.

Currently reviewed admission recipes: `AcknowledgedActionDialog`, `TypedConfirmationDialog`, `TeamMemberAccordion`, and `CopyFeedbackButton`. Only TypedConfirmationDialog has a complete promotion protocol; the others remain experimental until added to focused E2E protocols and the engine's allowlist. Fail-closed checks remain mandatory for any new recipe.
