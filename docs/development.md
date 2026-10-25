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

- [Quality](../.github/workflows/quality.yml): runs on PRs and pushes to `main` and includes offline checks, `npm ci`, Pi schemas, installation checks, `validate`, and `build`.
- [Manual E2E (main)](../.github/workflows/e2e-manual.yml): **manually triggered, on main only**. It does not run automatically for each PR.
- [Official visual audit](../.github/workflows/bootstrap-visual.yml): a separate workflow that can record screenshots, comparisons, and evidence.

Screenshots prove only what was rendered and observed. Pixel differences between demos with different data/states are diagnostic, **not automatic fidelity criteria**. See [visual review](revisao-visual-shadcn.md) and the [official audit](official-component-visual-audit.md).

## Definition of done

Record scope, changed files, tests actually run, and limitations. Schema changes require version/lock, provenance, examples, and independent review; visual changes require validation proportional to risk. Do not claim build, E2E, live Pi evaluation, or human review as complete without evidence.
