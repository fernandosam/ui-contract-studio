[English](e09-security-audit.md) | [Português](e09-security-audit.pt-BR.md)

# E09 — Dependency, Secret, Log and Sensitive-Data Retention Audit

Reviewed on 2026-10-29. Scope: the tracked UI Contract Studio source, its demonstration services, the offline Pi evaluation command, npm lockfile and GitHub Actions. This is a source/CI policy audit, **not** a claim that a live deployment, the full Git history, repository secrets or third-party provider storage were inspected.

## Findings and control decisions

| Area | Observed risk | Control and verification |
| --- | --- | --- |
| npm dependencies | `npm ci --no-audit` keeps reproducible installs but does not assess advisories. | `quality.yml` blocks on production high+ and complete dependency critical+ vulnerabilities via `npm audit`; Dependabot proposes reviewed updates. No automatic dependency merge or `npm audit fix --force`. |
| Pi CLI supply chain | The manually dispatched workflow installed the deprecated `@mariozechner/pi-coding-agent` without a version. | Install the maintained `@earendil-works/pi-coding-agent@1.4.0` explicitly with `--ignore-scripts` and restrict the evaluation to read-only JSON generation. Review the exact release and its dependency graph at each upgrade. |
| Committed credentials | `.env` is ignored, but a hard-coded token or private key could still be committed elsewhere. | `npm run security:check` scans tracked files for high-confidence key formats, disallowed private-key files and missing artifact retention policies; findings include only file path and category. Also enable GitHub secret scanning/push protection in repository settings where available; this script is not full-history scanning. |
| Pi evaluation stdout/stderr | Provider errors and parsing diagnostics might contain prompt content, tokens or unexpected data. | CLI errors are logged as fixed reason codes, never raw stderr; validation reports summarize failures instead of embedding model output. No sessions, tools, local project extensions, Pi update checks or telemetry in CI. |
| Pi raw JSON outputs | Raw generated specs were uploaded as Action artifacts, potentially exposing entered personal data. | Keep outputs only on the ephemeral runner for strict validation, remove them afterward, and upload aggregated metrics only with a 7-day artifact retention. No raw specs, generated prompts or per-scenario error bodies in artifacts. |
| Screenshots and test evidence | Screenshots, traces and composition reports may contain user-entered form data. | Every artifact uploader specifies a retention period of at most 14 days, shorter for Pi evaluations. CI evidence must use synthetic inputs. Never submit production or personal records to screenshot workflows. |
| Demo in-memory records | `createInMemoryDemoService` retains name and email in the Node process, and the HTTP gateway may keep receipt fingerprints until capacity eviction. | Demonstration records are bounded by size and time with explicit test coverage; the HTTP gateway cache requires TTL integration when the pending E09 authorization changes are merged. Until then, do not use this adapter for real personal data. |

## Data classes and handling

- **Secrets:** GitHub Actions supplies `PI_EVAL_API_KEY` only to the evaluation step. Use short-lived, least-privilege provider keys; rotate immediately if exposure is suspected. Never print values, include them in issue comments or attach them to artifacts.
- **Prompts/specifications:** Assume prompts, JSON specimens and model errors can contain sensitive content. Treat as ephemeral process data. Only aggregate counts, timings, allowed component names and sanitized issue categories may leave the runner.
- **Demo names/emails:** Synthetic by policy; never persist in git, telemetry or reports. An integration with real customers must specify lawful purpose, tenant isolation, user deletion and retention with the hosting service.
- **CI logs:** GitHub manages the lifetime of workflow logs separately from artifact `retention-days`; configure repository/org Actions log retention to the minimum operationally required (target: 14 days) and review access permissions.
- **External model providers:** Their own processing, logging and retention remain governed by the chosen provider. Do not assume `--no-session` controls the provider side.

## Manual/automated verification

```sh
npm run security:check
npm run test:offline
npm audit --omit=dev --audit-level=high
npm audit --audit-level=critical
```

The last two checks require npm registry/advisory access; outages fail the CI step rather than silently passing. Run a separate full-history secret scan (for example, a reviewed Gitleaks setup) and inspect GitHub repository security settings before production use. Check GitHub Actions runs for new errors and triage advisories with a documented accept/upgrade decision. Do not exempt known vulnerabilities by masking command exit codes.

## Remaining risks / acceptance boundary

This repository remains a UI demonstration, not an approved production identity or data storage service. The service gateway's pending authorization PRs must be integrated before altering shared retention logic. In particular, receipt deduplication currently keeps hashes/fingerprints in memory without an explicit TTL. Audit production adapters, provider contracts, backups and deletion behavior separately. **A green security check does not authorize Pi actions or grant data access.**
