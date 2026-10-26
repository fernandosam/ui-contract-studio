[English](admission-engine.md) | [Português](admission-engine.pt-BR.md)

# Admission Engine

An opt-in distribution pipeline for reviewed React+strict-Zod composition recipes. It does **not** grant a new type, event, action or permission in the authoritative Pi/json-render registry.

## Channels

| Channel | Trigger | Gate | Output |
| --- | --- | --- | --- |
| Experimental | Push to `main` (or manual rerun) | `npm ci`, reviewed recipe/allowlist checks, `npm run validate`, `npm run build` | GitHub Actions artifact `admission-experimental-<commit SHA>` |
| Stable distribution (post-E2E) | Manual **E2E manual (main)** | All full E2E tests pass, plus complete desktop/mobile evidence for the eligible candidate on the same checked-out commit | GitHub Actions artifact `admission-stable-<commit SHA>` |
| Native Pi catalog | Separate integration process | Strict Zod/registry/lock/source/license review; all existing Pi gates | `pi-catalog/contracts.json` (unchanged by this engine) |

The isolated **stable distribution** artifact means *E2E-homologated code snapshot*, not an automatically installed Pi contract or an indefinite hosted service. Artifacts expire under retention settings (experimental 30 days, stable 90 days). They contain the original React+Zod proposal files and a manifest. Consuming them requires an explicit integration step. Do not treat a `stable` channel label as evidence of WCAG compliance, screen-reader approval, security review, or production approval.

## Admission policy

The [policy](../src/ui-catalog/admission-engine/policy.json) explicitly allows four reviewed recipes: `alert-checkbox`, `alert-typed`, `accordion-members`, and `button-copy`. The generator validates TypeScript syntax, strict Zod fixture coverage, imports, dependencies and blocked side effects. Generated artifacts carry file SHA-256 hashes, a candidate digest and the source commit SHA. A candidate already in the Pi catalog is rejected.

Only `alert-typed` has a verified browser-evidence protocol, and thus is the only candidate initially eligible for stable distribution. Other proposals cannot be promoted by merely adding a metadata flag. Introduce an explicit browser protocol, tests and expected evidence for each new candidate before extending the engine.

## Local commands

~~~bash
npm run admission:check
npm run validate && npm run build
npm run admission:publish -- --revision=<full-Git-commit-SHA>
# Run Playwright in a browser-equipped environment on the same revision:
npm run composition:pilot:reset
npm run test:composition:pilot
npm run composition:pilot:report
npm run admission:promote -- --revision=<same-full-Git-commit-SHA>
~~~

The experimental manifest is written to `dist/admission/experimental/catalog.json`. After E2E, `dist/admission/stable/catalog.json` contains the admitted candidate, SHA-256 evidence digests, source digest and revision. The workflow executes `npm run test:e2e` instead of the focused browser command, and then checks the ten focused cases it produced. Stale evidence is cleared first. Promotion fails if the summary, any record, any screenshot, project, case, status or revision-scoped publication is missing or invalid.

**Trust boundary:** evidence files are *not cryptographically signed*. The trusted GitHub Actions workflow binds them to the checked-out source by regenerating the code and running Playwright in the same main-branch job, with read-only repository permissions. Do not accept arbitrary uploaded JSON/screenshots as certification. Artifact provenance is tied to the Actions run and Git commit. Local promotion is a development dry run, not independent certification.

The engine never writes to `contracts.lock.json`, `sources.json`, `pi-catalog/contracts.json`, approved registries or action allowlists; this is enforced by separation of output paths and existing checks. Importing the standalone artifact into the actual Pi runtime remains a **separate, reviewed integration**, not silently implied by E2E success.
