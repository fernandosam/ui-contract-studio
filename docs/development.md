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
| `npm run perf:web:all` | Opt-in [production web performance lab](web-performance.md): bundles, browser rendering, heap and mobile emulation |

`docs:check` works without network access. Documentation-only changes should run `docs:check` and `test:offline`; code changes require their specific checks and, where available, `validate` and `build`.

## Native auto-merge for ordinary pull requests

The existing [quality workflow](../.github/workflows/quality.yml) automatically requests GitHub's **native squash auto-merge** on opening or updating a non-draft PR targeting `main`, **only when its head branch belongs to this repository**. It does not create another PR or skip any required checks. GitHub itself waits for the protected `main` status checks (semantic/offline + integration/build, including the source-bound form browser protocol).

The small [eligibility guard](../scripts/ci-auto-merge-policy.mjs), executed **from the trusted base commit**, examines every file in the GitHub API PR diff. Workflow/action, CI-policy, dependency, contract-lock, Zod/Pi admission, permissions and backend changes require ordinary manual review and are **not enrolled**. Renaming a sensitive file is treated as sensitive too. Drafts are not enrolled; if a later revision becomes sensitive or is converted into a draft, the workflow attempts to disable auto-merge. Fork PRs are excluded. The isolated job does not execute PR code with its write-scoped token and never uses `--admin`.

**Operational prerequisites:** repository Settings → General → Pull Requests → Allow auto-merge enabled; Actions permissions must allow the scoped job to update PRs. When eligible, the job uses `gh pr merge --auto --squash --match-head-commit`. If GitHub rejects the request, the CI job reports the error and the PR remains for manual action; no protection is bypassed. The focused browser-review job is currently additional (not a mandatory ruleset status); the two required checks still include the local form's browser admission proof.

## CI and browser testing

- [Quality](../.github/workflows/quality.yml): runs on PRs and pushes to `main`, splitting no-install offline tests from immutable `npm ci`, Pi schema, lint, integration and build checks. Focused Playwright checks are skipped for documentation-only PRs; source, config, dependency and workflow changes continue to run them.
The existing **Source, docs and offline tests** job also gates semantic quality using `semantic:check` and `semantic:report`. It uploads the `semantic-knowledge-report` artifact (coverage/freshness JSON and failure logs) even when semantic validation fails, and writes an actionable job summary. Failed JSON is explicitly marked `validation.status: failed`; code-change review warnings are advisory. See [semantic checklist T28](semantic-knowledge-checklist.md) for commands and regression scenarios.

- [Manual E2E (main)](../.github/workflows/e2e-manual.yml): **diagnostic only**. Runs the full source-bound E2E suite on `main`, retains evidence and has read-only permissions. It does not create a certification PR or change Pi permissions.
- [Official visual audit](../.github/workflows/bootstrap-visual.yml): a dedicated manual bootstrap and screenshot-comparison workflow, without repeating functional full E2E.

Screenshots prove only what was rendered and observed. Pixel differences between demos with different data/states are diagnostic, **not automatic fidelity criteria**. See [visual review](revisao-visual-shadcn.md) and the [official audit](official-component-visual-audit.md).

## Definition of done

Record scope, changed files, tests actually run, and limitations. Schema changes require version/lock, provenance, examples, and independent review; visual changes require validation proportional to risk. Do not claim build, E2E, live Pi evaluation, or human review as complete without evidence.

Workflows share `.github/actions/setup-deps` (Node 22, npm cache, immutable `npm ci`) and `.github/actions/setup-chromium` (reuse system browser; install Chromium only as a fallback). The paid [Pi evaluation](../.github/workflows/pi-evaluation.yml) is manual and restricted to `main`; no paid evaluations run in PR CI.

Risk-driven semantic E2E cases (T29) are documented in [semantic E2E risks](semantic-e2e-risks-t29.md). They run within the existing focused PR browser job and the existing manual main suite; the reports are advisory, not automatic Pi certification.

## TypeScript 7 compiler and TypeScript 6 tooling API

TypeScript 7.0 does not provide the compiler API consumed by `typescript-eslint`. The supported setup deliberately installs `typescript` as `npm:@typescript/typescript6@6.0.2` for ESLint and `@typescript/native` as `npm:typescript@7.0.2` for the native compiler. The TypeScript 6 compatibility package depends on `@typescript/old`, which can also expose a `tsc` binary; therefore **do not depend on whichever `npx tsc` binary npm links**. `npm run typecheck` runs `node ./node_modules/@typescript/native/bin/tsc -b --pretty false` explicitly, and `npm run build` includes this check before Vite. The lockfile is committed for reproducibility, and `npm ci`, ESLint, typecheck and build must all pass without peer-dependency bypass flags. See [Microsoft's dual-compiler guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
