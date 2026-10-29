[English](layout-quality.md) | [Português](layout-quality.pt-BR.md)

# Automatic layout quality evaluation

Layout quality is an **advisory estimate** computed directly from the generated Pi JSON tree for registration, login, search, and dashboard. It is displayed in the existing `RequirementsWizard` and `PatternWizard` previews, as well as the existing audit reports. No workflow, approval gate, merge requirement, status, or certification step is added.

## Scoring

The pure `evaluateLayoutQuality(requirements, screen)` function in `src/ui-requirements/layout-quality.ts` produces a 0–100 score. Four dimensions are weighted equally at 25 points, each comprising five deterministic 5-point checks. Failed checks reduce the score and return `findings[]` with `dimension`, `code`, `nodeIds`, `deduction`, `message`, and `suggestion` for agent or human remediation.

| Dimension | Static evidence |
| --- | --- |
| **Hierarchy (25)** | Root container, title, region order, primary content, action/note position |
| **Grouping (25)** | Expected Stack/Grid, field/indicator membership, headings/labels, graph references and spacing |
| **Density (25)** | Requested column count, caps, nonempty groups, content balance and gaps |
| **Responsiveness (25)** | Declared width and centering, CSS-compatible grid counts, vertical stacks, DOM reading order and absence of arbitrary overrides |

The evaluator uses the existing semantic profiles (`registration-layout.json`, `pattern-layouts.json`) rather than adding another contract layer. Its output includes `score`, per-dimension `scores`, actionable findings and `basis: static-declarative`, `policy: advisory-only`, `runtimeEvidence: not-executed`. Invalid trees score **0** rather than being treated as valid visual evidence. The `list` pattern is deliberately not assigned a detailed layout score because it lacks a comparable semantic layout profile.

## Usage and traceability

When a preview is generated, the quality panel displays the total, four dimensions and suggested corrections. Evaluation does **not** mutate the original JSON. Existing audits now include `layoutQuality` per generated case, independent of `correct`, Zod conformity, blockers and requirements traceability:

```sh
npm run requirements:audit
npm run requirements:patterns:audit
npx tsx --test tests/layout-quality.integration.test.ts
npm run test:offline
npm run typecheck
```

Agents may prioritize corrections by the lowest dimension scores. **No minimum score blocks generation, PRs or auto-merge.** Existing independent Pi contract review and admission mechanisms remain unchanged. The current impact mapper relates evaluator changes to affected interface families.

## Limitations

This is not a measurement of actual geometry, overflow, pixel alignment, contrast, color, accessibility or breakpoint behavior. “Responsiveness” is **inferred** from the declarative tree and existing responsive CSS, not browser certification. Browser tests, E2E and human review remain separate evidence when needed. The evaluator never extends Zod types/props, admits components, authorizes actions or broadens Pi permissions. Even 100/100 does not certify production readiness.

## Next step: bounded automatic repair loop

`improveLayoutQuality(requirements, generated)` in `src/ui-requirements/layout-repair.ts` performs up to **12 safe in-memory edits** on a copy of a generated JSON screen. Both existing preview wizards and the existing audits call the same function. It adds no button, approval workflow, merge criterion or new Pi permission. It only improves layout composition; it never changes the functional requirements.

**Allowed edits:** reorder only existing child IDs with identical membership, or restore **already-declared** `direction`, `gap`, `columns`, `maxWidth` and `centered` props to the reviewed semantic plan. It cannot add/remove nodes, change component types, introduce props, alter content/labels, events, actions, data sources, permissions or React code. Missing fields, contradictory content and unprofiled layouts are never invented.

**Technical safety, not an approval stage:** a candidate replaces the in-memory preview only if the original JSON satisfies the admitted catalog/graph checks, the candidate passes **Pi Zod + graph invariants + independent requirements trace**, the total score improves and no dimension deteriorates. Otherwise the original stays intact. The result records `status: unchanged | improved | not-applicable`, before/after score, reason and exact edited paths. Processing is deterministic and idempotent.

```sh
npx tsx --test tests/layout-repair.integration.test.ts tests/layout-quality.integration.test.ts
npm run requirements:audit
npm run requirements:patterns:audit
npm run typecheck
npm run build
```

Safety rechecks are **not** a new product or PR approval. They ensure visual repairs cannot bypass existing contract constraints. A score of 100 still does not certify rendered layout, accessibility or E2E, which require independent evidence when relevant.


## Executable browser geometry (additional advisory evidence)

The existing quality panel also evaluates **actual rendered geometry** of the approved JSON preview. The evaluator in `src/ui-runtime/layout-runtime-quality.ts` observes the rendered preview surface only and reports a **separate** 0–100 runtime score. The original static result and Pi contract/admission policies remain unchanged.

The browser checks use live bounding rectangles, computed visibility and scroll dimensions: heading order and clipping (hierarchy); group containment and overlaps (grouping); effective grid columns and control sizing/overlaps (density); and viewport bounds/horizontal overflow (responsiveness). Results declare `basis: browser-geometry`, `runtimeEvidence: browser-measured`, `policy: advisory-only`, viewport dimensions, tested/not-applicable rules and actionable findings. Inapplicable checks are not claimed as verified. The panel automatically remeasures on preview or window resize.

Run on both desktop and mobile with the existing Playwright harness:

```sh
npm run layout:browser:test
```

The suite renders registration, login, search and dashboard, plus an injected-overflow regression test. JSON measurements are saved under `reports/layout-runtime/<project>/<flow>.json` and archived by the existing browser-impact CI job. Only the existence and consistency of real evidence are asserted: **no minimum score blocks a PR or admission**. Even a 100/100 score is not a certification of aesthetics, accessibility, keyboard behavior or other browsers.
