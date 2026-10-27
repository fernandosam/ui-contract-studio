[English](semantic-knowledge-integration-t14.md) | [Português](semantic-knowledge-integration-t14.pt-BR.md)

# T14 — Integrated semantic validation of selection, forms and compositions (P1)

**Reviewed:** 2026-10-27. **Baseline:** [T01 checklist](semantic-knowledge-checklist.md) and [T08 integration](semantic-knowledge-integration-t08.md). This is advisory semantic documentation with static evidence and negative regression tests, **not Pi contract admission**.

## Source of records

The integration branch collects the documentation and tests from [T09 PR #37](https://github.com/fernandosam/ui-contract-studio/pull/37), [T11 PRs #40](https://github.com/fernandosam/ui-contract-studio/pull/40), [#41](https://github.com/fernandosam/ui-contract-studio/pull/41), [#42](https://github.com/fernandosam/ui-contract-studio/pull/42), [T12 PR #43](https://github.com/fernandosam/ui-contract-studio/pull/43) and [T13 PR #44](https://github.com/fernandosam/ui-contract-studio/pull/44). T10 Tabs/Table and T02–T08 are already on main. This does not merge or promote any of the original PRs.

## Cross-component inventory

| Task | Components | Admission boundary | Static / not implemented / runtime review | Evidence references | FAQs | Candidate integrations | Derived tests |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| T09 | Input, Checkbox, Radio, RadioGroup, Switch | RadioGroup is a React wrapper **not a Pi type** | 31 / 15 / 10 | 73 | 41 | 46 | 43* |
| T11 | ButtonGroup, Drawer, Tooltip | Existing approved contracts | 14 / 11 / 6 | 32 | 17 | 20 | 19 |
| T12 | Field, DatePicker, DataTable | Existing approved extension contracts | 23 / 11 / 6 | 60 | 19 | 22 | 22 |
| T13 | Combobox, Command, Sheet | `candidate-not-admitted` | 15 / 7 / 6 | 44 | 15 | 24 | 23 |
| **Total** | **14 records** | **10 already approved types; 4 unapproved** | **83 / 44 / 28** | **209** | **92** | **112** | **107*** |

*Two T14 `candidate-not-executable` tests were added for the previously uncovered gaps `radio-group-pi-type` and `required-and-invalid-pi`. Evidence references are not equivalent to runtime tests.

The existing AlertDialog, T02–T07 Dialog/DropdownMenu/Popover/Select/Accordion/Button and T10 Tabs/Table overlays and tests remain as the baseline.

## Integration risks and decisions

- **Radio vs RadioGroup:** an installed React wrapper does not create a Pi contract. Radio remains the approved type; do not alias RadioGroup.
- **Switch:** upstream `required` / `invalid` capability is not exposed by the Pi contract. Both require separate admission and a negative candidate test.
- **Combobox / Select / Input:** searchable selection, static selection, and free-form text are distinct. Combobox remains a documentary candidate.
- **Command / DropdownMenu:** displayed hotkey text does not register a shortcut or authorize navigation/backend effects.
- **Sheet / Drawer / Dialog:** shared React dependencies do not confer Pi authorization or implicit form save/discard. Focus, keyboard, screen-reader and viewport checks are still runtime-review tasks.
- **Field / DatePicker / DataTable:** existing versions and real source evidence must be respected, and remote data, validation and actions cannot be enlarged by prose.
- **Integration / FAQ:** every candidate dependency remains `advisory-only`, and agent advice uses `not-granted`.

## Derived checks

`tests/semantic-integration-t14.test.mjs` covers all 23 required overlays, provenance, reviewed status, static code evidence, implementation gaps, test-case traceability, cross-family candidate integration and advisory agent projections. Negative mutation checks reject fake code proofs, unsupported implementation promotion and fabricated runtime certification. Candidates must not appear in `selectAgentSemanticAdvice`.

## Execution and scope boundary

On the integration PR, [`quality.yml`](../.github/workflows/quality.yml) runs `npm run semantic:check`, `npm run semantic:report`, `npm run docs:check`, `npm run test:offline` and `npm run contracts:diff`, plus source/build integration checks. **Actual command outcomes are recorded by that workflow, not inferred from the connector's static inventory.** The derived `reports/composition-analysis/semantic-knowledge.json` is advisory and is not an admission authority.

No changes to `pi-catalog/`, contract locks, catalogs, Zod schemas, admission engines or Pi permissions are within scope. Browser/manual accessibility, responsive interaction and backend integration remain pending separate runtime reviews.

## Verified CI execution (2026-10-27)

[Quality workflow #40505542083](https://github.com/fernandosam/ui-contract-studio/actions/runs/40505542083) on commit `0a80a457f57d62c542e5a2b46f869a2285fde596` completed with **all four jobs successful**:

- `semantic:check` — PASS; 23 curated profiles validated with first-party code needles.
- `semantic:report` — PASS; advisory report generated (not admission).
- `docs:check` — PASS; localized links and references validated.
- `test:offline` — PASS; **312/312 tests, 0 failures**, including T14 cross-component negatives and T09–T13 source tests.
- `contracts:diff` — PASS; no unauthorized contract changes.
- Integration/source verification, lint, TypeScript, production build, experimental artifacts and Pi validation — PASS.
- Focused admission browser suite (desktop/mobile) — PASS; **30 Playwright tests**. [Browser evidence artifact](https://github.com/fernandosam/ui-contract-studio/actions/runs/40505542083/artifacts/12735400601). This is **not** the full manual E2E suite.

An earlier attempt, [#40505391970](https://github.com/fernandosam/ui-contract-studio/actions/runs/40505391970), failed only because `tests/bilingual-docs.test.mjs` expected 40 bilingual guides before this 41st pair. Its inventory was updated; the run above confirms the correction. Runtime-only semantic claims remain pending dedicated manual/E2E reviews.
