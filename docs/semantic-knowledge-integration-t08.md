[English](semantic-knowledge-integration-t08.md) | [Português](semantic-knowledge-integration-t08.pt-BR.md)

# T08 — Integrated semantic knowledge validation

**Reviewed on:** 2026-10-27. **Baseline:** [AlertDialog and the T01 checklist](semantic-knowledge-checklist.md). This delivery integrates the component proposals in PRs [#30](https://github.com/fernandosam/ui-contract-studio/pull/30), [#31](https://github.com/fernandosam/ui-contract-studio/pull/31), [#32](https://github.com/fernandosam/ui-contract-studio/pull/32), [#33](https://github.com/fernandosam/ui-contract-studio/pull/33), [#34](https://github.com/fernandosam/ui-contract-studio/pull/34) and [#35](https://github.com/fernandosam/ui-contract-studio/pull/35). All six were still independent, unmerged PRs when T08 started; this branch consolidates them for integrated testing.

## Audited inventory

| Component | Static / unimplemented / runtime-review capabilities | Literal code evidence | Candidate integrations | FAQ decisions | Derived tests | Source reviewed |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Dialog | 5 / 3 / 3 | 13 | 11 | 8 | 10 | 2026-10-26 |
| DropdownMenu | 9 / 5 / 3 | 17 | 7 | 8 | 9 | 2026-10-26 |
| Popover | 5 / 4 / 4 | 16 | 12 | 8 | 9 | 2026-10-26 |
| Select | 9 / 6 / 4 | 29 | 12 | 10 | 13 | 2026-10-26 |
| Accordion | 7 / 3 / 2 | 15 | 9 | 9 | 12 | 2026-10-26 |
| Button | 8 / 3 / 2 | 18 | 10 | 8 | 9 | 2026-10-27 |
| **Total** | **43 / 24 / 18** | **108** | **61** | **51** | **62** | — |

**Static audit (2026-10-27):** all **108/108** literal `path` and `contains` evidence pairs were located in the repository source at the common base commit. All overlays have purpose, rationale, usage and avoidance guidance, agent notes, explicit implementation states, candidate integrations, decision FAQs, derived tests, and official source/review metadata. All 24 unimplemented capabilities have `candidate-not-executable` test proposals, and the 18 runtime-review capabilities have visual, integration, or accessibility test cases. Literal source evidence does not certify browser behavior.

**Official sources:** [ReUI Dialog](https://reui.io/components/dialog), [DropdownMenu](https://reui.io/components/dropdown-menu), [Popover](https://reui.io/components/popover), [Select](https://reui.io/components/select), [Accordion](https://reui.io/components/accordion), [Button](https://reui.io/components/button). Component-specific dates are in `source.reviewedOn`. Base UI is installed; Radix examples are not proof of Pi props.

## Integration regressions and fixes

- The common `tests/semantic-knowledge.test.mjs` now retains 7 component-specific new tests from T02, T03, T04, T05 and T07; the integrated tests also explicitly cover the T06 Accordion onboarding/SSR constraints and remaining classified gaps.
- Removed rigid assumptions of one or two curated overlays. The integrated suite asserts that the current inventory contains seven overlays (AlertDialog and six new ones), 108 source assertions, consistency of capability/test IDs and state boundaries, official source provenance, and advisory-only Pi output.
- Negative tests, for **each** new component, reject fake evidence, fabricated implementation, and runtime claims with unreviewed evidence.

## Executable CI evidence

The **Source, docs and offline tests** job in `.github/workflows/quality.yml` explicitly runs:

```bash
npm run semantic:check
npm run semantic:report
npm run docs:check
npm run test:offline
```

The **Source checks, schemas and production build** job includes `npm run check`, lint, integration tests and production build. The generated `reports/composition-analysis/semantic-knowledge.json` is derived advisory output, never a Pi authorization manifest.

**Evidence record at PR creation:** all 108 static assertions were found by source inspection through GitHub. Actual npm command success is verified from completed PR CI jobs; it must not be inferred from static checks. The initial workflow run confirmed successful explicit semantic check and report steps, and found a bilingual document inventory mismatch corrected by this English companion and updated inventory expectations.

## Authorization boundaries and outstanding work

- No changes to `src/ui-catalog/catalog.ts`, `src/ui-catalog/extensions/catalog.ts`, Zod schemas, `pi-catalog/`, allowlists, admission engine, permissions, runtime contracts or React component implementations.
- `implemented-static-evidence` is only located source code. `documented-not-implemented` is not a new capability. `runtime-review-required` still needs targeted E2E, keyboard, screen-reader and responsive inspections.
- Integrations remain `advisory-only` in the report and `not-granted` in Pi advice. Navigation, persistence, backend actions, and promotion require separate authorized implementation/review. This integrated static audit is not full E2E certification.
