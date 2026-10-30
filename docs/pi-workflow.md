[English](pi-workflow.md) | [Português](pi-workflow.pt-BR.md)

# Pi Agent Workflow

Current guidance is in [Agents and Pi](agents.md) and the [UI Catalog skill](../.pi/skills/ui-catalog/SKILL.md).

Summary:

1. Consult `pi-catalog/contracts.json`, retired types, and approved patterns.
2. Compare admitted candidates with `npm run pi:select -- --requirement="explicit button action" --types=Button,Card` (read-only, advisory). Examine positive evidence, when-not-use exclusions, documentary capability differences, and ambiguity; do not treat the ranking as admission. Then run `npm run pi:zod-schema` and `npm run pi:context -- --types=Card,Button --requirement="explicit button action"` with only strictly necessary approved types.
3. Generate JSON only, using properties, events, and actions from the actual schema; do not use `--metadata-only` for generation.
4. Validate with `npm run pi:validate -- --file=<spec.json>`; resolve `issues[].pointer`.
5. Record real checks and limitations. To persist a privacy-minimized, versioned selection decision with contract/evidence references, use [E10 decision records](pi-decision-records.md) (opt-in). Never disclose secrets or treat payment/authorization demos as actual services.

`semanticName` helps readability; the public property name remains the Zod key until a formal migration.
