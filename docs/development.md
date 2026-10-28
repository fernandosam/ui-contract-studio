[English](development.md) | [Português](development.pt-BR.md)

# Development and Quality

Use Node.js **22+** and dependencies verified by `package-lock.json`. The [README](../README.md) explains installation; limited-network environments should consult the [sandbox](../sandbox/README.md).

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development with Vite |
| `npm run test:offline` | Node.js invariants without installing dependencies |
| `npm run docs:check` | Local links and manifest consistency |
| `npm run validate` | Structural checks, lint, and tests |
| `npm run build` | TypeScript and Vite bundle |
| `npm run verify` | Local validation, build, and E2E |
| `npm run shadcn:verify` | Primitive installation integrity |
| `npm run composites:generated:check` | Generated files are in sync |
| `npm run pi:verify` | Agent API and fixtures |

`docs:check` works without network access. Documentation-only changes should run `docs:check` and `test:offline`; code changes require their specific checks and, where available, `validate` and `build`.

## CI and browser testing

- [Quality](../.github/workflows/quality.yml): runs on PRs and pushes to `main`, splitting no-install offline tests from immutable `npm ci`, Pi schema, lint, integration and build checks. Focused Playwright checks are skipped for documentation-only PRs; source, config, dependency and workflow changes continue to run them.
The existing **Source, docs and offline tests** job also gates semantic quality using `semantic:check` and `semantic:report`. It uploads the `semantic-knowledge-report` artifact (coverage/freshness JSON and failure logs) even when semantic validation fails, and writes an actionable job summary. Failed JSON is explicitly marked `validation.status: failed`; code-change review warnings are advisory. See [semantic checklist T28](semantic-knowledge-checklist.md) for commands and regression scenarios.

- [Manual E2E (main)](../.github/workflows/e2e-manual.yml): **manual and main-only**. A read-only job executes full E2E; a separate write-scoped job downloads proof from the same run, verifies the tested SHA and alone records certificates. Moving `main` blocks stale certification.
- [Official visual audit](../.github/workflows/bootstrap-visual.yml): a dedicated manual bootstrap and screenshot-comparison workflow, without repeating functional full E2E.

Screenshots prove only what was rendered and observed. Pixel differences between demos with different data/states are diagnostic, **not automatic fidelity criteria**. See [visual review](revisao-visual-shadcn.md) and the [official audit](official-component-visual-audit.md).

## Definition of done

Record scope, changed files, tests actually run, and limitations. Schema changes require version/lock, provenance, examples, and independent review; visual changes require validation proportional to risk. Do not claim build, E2E, live Pi evaluation, or human review as complete without evidence.

Workflows share `.github/actions/setup-deps` (Node 22, npm cache, immutable `npm ci`) and `.github/actions/setup-chromium` (reuse system browser; install Chromium only as a fallback). The paid [Pi evaluation](../.github/workflows/pi-evaluation.yml) is manual and restricted to `main`; no paid evaluations run in PR CI.

Risk-driven semantic E2E cases (T29) are documented in [semantic E2E risks](semantic-e2e-risks-t29.md). They run within the existing focused PR browser job and the existing manual main suite; the reports are advisory, not automatic Pi certification.
