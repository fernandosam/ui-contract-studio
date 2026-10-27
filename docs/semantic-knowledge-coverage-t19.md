[English](semantic-knowledge-coverage-t19.md) | [Português](semantic-knowledge-coverage-t19.pt-BR.md)

# T19 — Semantic coverage matrix for 31 ReUI families

**Reviewed:** 2026-10-27. **Scope:** versioned local ReUI examples and existing semantic guidance only; no contract admission. **Reference:** [T01 checklist](semantic-knowledge-checklist.md) and `src/ui-catalog/knowledge/alert-dialog.json`.

## Inventory reconciliation

- **31 families / 559 examples**: derived from 559 entries in `src/ui-catalog/reui-primitive-source-baseline.json` and reconciled with the keys of `src/ui-catalog/reui-guidance.json`.
- **39 curated overlays**: 31 belonging to the ReUI example families **plus eight independent overlays** outside those families: `AlertDialog` (existing reference), `Combobox`, `Command`, `DataTable`, `DatePicker`, `Field`, `Radio` and `Sheet`.
- **Why the counts initially differed:** before T17 and T18 integration, `main` contained 30 knowledge files, corresponding to 22 ReUI families and the eight additional overlays. PRs [#76 (T17)](https://github.com/fernandosam/ui-contract-studio/pull/76) and [#77 (T18)](https://github.com/fernandosam/ui-contract-studio/pull/77) supplied exactly nine missing files; both were merged on 2026-10-27. No invented families were required.
- **444 documented capabilities:** 230 supported by static code evidence (**E**), 126 documented but not implemented (**D**) and 88 requiring runtime review (**R**). The **315 derived test cases** are proposed verifications, not 315 certified executions. The matrix below separates 31 example families (356 capabilities, 257 test cases) from eight additional overlays (88 capabilities, 58 test cases).

## Audited matrix — 31 ReUI families

E/D/R means `implemented-static-evidence` / `documented-not-implemented` / `runtime-review-required`. Derived tests describe expectations; they are **not** proof of passing browser E2E tests.

| Family / overlay | Examples | E/D/R | Derived tests |
| --- | ---: | ---: | ---: |
| [Accordion](../src/ui-catalog/knowledge/accordion.json) | 11 | 7/3/2 | 12 |
| [Alert](../src/ui-catalog/knowledge/alert.json) | 20 | 5/3/2 | 8 |
| [Avatar](../src/ui-catalog/knowledge/avatar.json) | 35 | 4/2/2 | 5 |
| [Badge](../src/ui-catalog/knowledge/badge.json) | 25 | 4/2/2 | 5 |
| [Button](../src/ui-catalog/knowledge/button.json) | 61 | 8/3/2 | 9 |
| [ButtonGroup](../src/ui-catalog/knowledge/button-group.json) | 57 | 5/3/2 | 6 |
| [Card](../src/ui-catalog/knowledge/card.json) | 18 | 4/4/2 | 8 |
| [Carousel](../src/ui-catalog/knowledge/carousel.json) | 11 | 7/4/3 | 11 |
| [Checkbox](../src/ui-catalog/knowledge/checkbox.json) | 22 | 6/3/2 | 9 |
| [Collapsible](../src/ui-catalog/knowledge/collapsible.json) | 10 | 5/3/2 | 9 |
| [Dialog](../src/ui-catalog/knowledge/dialog.json) | 10 | 5/3/3 | 10 |
| [Drawer](../src/ui-catalog/knowledge/drawer.json) | 5 | 4/5/2 | 7 |
| [DropdownMenu](../src/ui-catalog/knowledge/dropdown-menu.json) | 18 | 9/5/3 | 10 |
| [Input](../src/ui-catalog/knowledge/input.json) | 31 | 7/3/2 | 9 |
| [Pagination](../src/ui-catalog/knowledge/pagination.json) | 15 | 7/3/2 | 8 |
| [Popover](../src/ui-catalog/knowledge/popover.json) | 11 | 5/4/4 | 9 |
| [Progress](../src/ui-catalog/knowledge/progress.json) | 8 | 5/4/2 | 10 |
| [RadioGroup](../src/ui-catalog/knowledge/radio-group.json) | 17 | 6/3/2 | 9 |
| [Rating](../src/ui-catalog/knowledge/rating.json) | 9 | 7/4/3 | 11 |
| [Select](../src/ui-catalog/knowledge/select.json) | 33 | 9/6/4 | 13 |
| [Separator](../src/ui-catalog/knowledge/separator.json) | 6 | 4/2/2 | 4 |
| [Skeleton](../src/ui-catalog/knowledge/skeleton.json) | 10 | 4/2/2 | 4 |
| [Slider](../src/ui-catalog/knowledge/slider.json) | 12 | 7/3/2 | 7 |
| [Spinner](../src/ui-catalog/knowledge/spinner.json) | 12 | 4/3/2 | 5 |
| [Switch](../src/ui-catalog/knowledge/switch.json) | 14 | 6/3/2 | 9 |
| [Table](../src/ui-catalog/knowledge/table.json) | 17 | 7/4/3 | 10 |
| [Tabs](../src/ui-catalog/knowledge/tabs.json) | 9 | 6/3/3 | 9 |
| [Textarea](../src/ui-catalog/knowledge/textarea.json) | 6 | 6/3/2 | 9 |
| [Toggle](../src/ui-catalog/knowledge/toggle.json) | 14 | 6/3/2 | 7 |
| [ToggleGroup](../src/ui-catalog/knowledge/toggle-group.json) | 16 | 7/4/2 | 9 |
| [Tooltip](../src/ui-catalog/knowledge/tooltip.json) | 16 | 5/3/2 | 6 |
| **Total ReUI** | **559** | **181/103/72** | **257** |


## Additional overlays — do not expand the ReUI family inventory

| Overlay | E/D/R | Tests | Notes |
| --- | ---: | ---: | --- |
| [AlertDialog](../src/ui-catalog/knowledge/alert-dialog.json) | 5/2/2 | 6 | Existing T01 reference |
| [Combobox](../src/ui-catalog/knowledge/combobox.json) | 5/2/2 | 8 | Documentary candidate; not automatically admitted |
| [Command](../src/ui-catalog/knowledge/command.json) | 5/3/2 | 8 | Documentary candidate; not automatically admitted |
| [DataTable](../src/ui-catalog/knowledge/data-table.json) | 10/4/2 | 9 | Separate contract outside the 31 families |
| [DatePicker](../src/ui-catalog/knowledge/date-picker.json) | 8/4/2 | 7 | Separate contract outside the 31 families |
| [Field](../src/ui-catalog/knowledge/field.json) | 5/3/2 | 6 | Separate contract outside the 31 families |
| [Radio](../src/ui-catalog/knowledge/radio.json) | 6/3/2 | 7 | Distinct from the example family `RadioGroup` |
| [Sheet](../src/ui-catalog/knowledge/sheet.json) | 5/2/2 | 7 | Documentary candidate; not automatically admitted |
| **Additional total** | **49/23/16** | **58** | **8 overlays** |


## T01 checklist, gaps, and authority boundaries

Each of the **39 overlays** was inspected for: canonical identity and official source URL, source sections and review date (Oct 26 or 27, 2026); purpose; rationale; when to use/avoid; AI-agent notes; classified capabilities; `src/` code paths and exact snippets for statically evidenced capabilities; proposed integrations; FAQ decisions; test requirements; derived test cases referencing existing capability IDs; and a clear boundary between knowledge, implementation, and admission. All overlays are marked `reviewed-documentation`, a **documentation-only** status.

**T19 gap fixed:** `DropdownMenu` described its statically evidenced `separators` capability without a linked derived test. The new `separator-groups-not-selectable` case requires separators to be neither focusable nor selectable; documenting that test does not constitute executing it in a browser.

**Additional reporting gap fixed:** the `semantic:report` CLI previously called the aggregator without ReUI examples, yielding `coveredExamples: 0` despite a 559-example baseline. The command now supplies the existing `src/ui-catalog/reui-primitive-source-baseline.json` inventory and reports `coveredExamples: 559`; guidance remains advisory only.

**Intentionally open gaps:** the 126 `documented-not-implemented` capabilities are not new APIs. The 88 `runtime-review-required` capabilities still need real keyboard, focus, accessibility, responsive-layout, and/or interaction testing. Integrations remain `advisory-only`. No changes were made to Zod schemas, admitted APIs, `contracts.lock.json`, `pi-catalog/` or Pi permissions.

## Reproducible evidence and verification

- `tests/semantic-coverage-t19.test.mjs` enforces inventory counts (31/559/39), one-to-one naming, the T01 checklist via `validateSemanticOverlay`, code-evidence integrity, capability-to-test traceability, non-executable candidate scenarios, admission boundaries, and `buildSemanticKnowledge`.
- `npm run semantic:check` validates curated overlays against versioned source evidence; `npm run semantic:report` regenerates `reports/composition-analysis/semantic-knowledge.json` as a **derived report**, never a contract authority.
- `node --test tests/semantic-coverage-t19.test.mjs`, `npm run test:offline` and `npm run docs:check` provide further static checks. Refer to the T19 PR CI for observed results; CI success is not an E2E certification.
- `npm run reui:audit:check` checks the independently versioned source baseline. `tests/e2e/reui-gallery-full.spec.ts` remains a manual browser test, outside the certification scope of T19.

**Definition of done:** 31 families mapped to 31 overlays, eight additional overlays explained, all mandatory checklist sections populated, every capability linked to a derived test, `semantic:check` and `semantic:report` passing in CI, no automatic changes to contract admission.
