[English](agents.md) | [Português](agents.pt-BR.md)

# Agent and Pi Integration

Pi can generate **JSON specs only**, using types and properties published in the json-render/Zod catalog. Visual ReUI examples and shadcn/ui files do not grant additional APIs to the agent.

## Generating a spec

1. Consult `pi-catalog/contracts.json`, `pi-catalog/retired-contracts.json`, and approved JSON patterns in `src/ui-patterns/`.
2. Generate real schemas and select **only the required types** (up to 25 per batch):

   ~~~bash
   npm run pi:select -- --requirement="explicit button action" --types=Button,Card
   npm run pi:zod-schema
   npm run pi:context -- --types=Card,Button --requirement="explicit button action" --stdout
   ~~~

3. Use authorized `propsSchema`, examples, events, and actions. `semanticName` is only an auxiliary label; valid keys are defined in Zod. `--metadata-only` must not be used for generation.
4. Save the screen to `src/ui-screens/<slug>.json` and its metadata to `src/ui-screen-meta/<slug>.json`.
5. Validate and fix issues reported at `issues[].pointer`:

   ~~~bash
   npm run pi:validate -- --file=src/ui-screens/<slug>.json
   npm run pi:verify
   ~~~

## Action and data boundaries

- `content` and `nodeProps` accept only published fields; they must not modify `type`, `children`, `name`, `on`, `href`, `src`, `sourceId`, or actions.
- Demo data and events remain local. A DataTable `sourceId` may only reference authorized sources; real servers must enforce authentication, authorization, and access filters.
- New types require [admission](components.md) and independent human approval. Pi cannot grant itself additional catalog permissions.

## Live evaluations

Paid model runs are **manual** and require `PI_EVAL_CONFIRM=yes`. Paid repair also requires `PI_EVAL_REPAIR_CONFIRM=yes`. Report actual runs, failures, blockers, and missing results without fabricating outputs, metrics, or evidence.

Security review: [Pi Agent threat model (E09)](pi-agent-threat-model.md) distinguishes the coding-agent tool boundary from validated JSON rendering and the paid, no-tool evaluation subprocess.

Binding rules are in [AGENTS.md](../AGENTS.md); procedures are in the [UI Catalog skill](../.pi/skills/ui-catalog/SKILL.md). See the [short workflow](pi-workflow.md).
