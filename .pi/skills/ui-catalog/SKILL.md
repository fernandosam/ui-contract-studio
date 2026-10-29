---
name: ui-catalog
description: Generate JSON screens from a closed json-render catalog, reuse patterns, and submit extensions for independent review.
---

[English](SKILL.md) | [Português](SKILL.pt-BR.md)

# UI Catalog Skill

Follow the rules in [AGENTS.md](../../../AGENTS.md). This document provides Pi's operational procedure; it does not replace contract, security, or review policies.

## Creating or changing a screen

1. Read `pi-catalog/contracts.json`, `src/ui-catalog/contracts.lock.json`, `pi-catalog/retired-contracts.json`, and `src/ui-patterns/`. Reuse approved types and patterns before proposing new ones.
2. For a specific requirement, first run `npm run pi:select -- --requirement="explicit button action"` to inspect ranked alternatives and rationale. Respect `whenNotUse`, missing implementation evidence and `ambiguous`/`no-match` decisions; comparison IDs are documentary only. Choose approved types explicitly, then run `npm run pi:zod-schema` and `npm run pi:context -- --types=Card,Button --requirement="explicit button action" --stdout` (up to 25 types). The context includes advisory selection but does not add schemas or permissions. Consult `pi-catalog/examples/`; never use `--metadata-only` to generate.
3. Generate **only** `src/ui-screens/<slug>.json` and `src/ui-screen-meta/<slug>.json`; use Zod schemas, canonical props, approved slots, events, and actions. Do not copy JSX from templates or use unrestricted URLs or callbacks.
4. For composites, change only `content` and `nodeProps` using keys declared in the context; preserve the tree, field names, node type, actions, and links.
5. Run `npm run pi:validate -- --file=<spec.json>`, resolve `issues[].pointer`, then run `npm run patterns:check && npm run check:catalog && npm run validate && npm run build` where available. Report blockers and checks actually performed.

## Extending the catalog

- Admission requires a demonstrable functional gap and **a Zod schema + React component + registry**, provenance/license in `sources.json`, version/fingerprint in `contracts.lock.json`, tests, and independent approval.
- For static declarative compositions, edit the template/manifest and run `npm run composites:generate`; never edit `src/ui-catalog/extensions/generated/`. For stateful compositions or events, use React and a typed adapter.
- shadcn/ui and ReUI are implementation and example sources, **not** grants of access to the Pi catalog. See [components](../../../docs/components.md) and source inventories.
- Do not change the app shell, tokens, or base schemas for purely cosmetic reasons.

## Data, tests, and evidence

- DataTable accepts only an authorized `sourceId`. The `processos-api` demo endpoint does not include SSO/authorization; those guarantees belong in the backend.
- Run `npm run test:offline` and affected checks; `npm run verify` performs validation, build, and browser testing in a complete environment. GitHub E2E is manual on `main`.
- Visual testing is certified only with references, local screenshots, and human review. Do not claim execution or approval without evidence.
- Live Pi evaluations are manual and require `PI_EVAL_CONFIRM=yes`, and `PI_EVAL_REPAIR_CONFIRM=yes` for paid repair. Do not replace missing results with synthetic data.

See the [Pi workflow](../../../docs/pi-workflow.md), [quality](../../../docs/development.md), and [governance](../../../docs/governance.md).
