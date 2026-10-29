[English](official-component-visual-audit.md) | [Português](official-component-visual-audit.pt-BR.md)

# Visual Comparison with Official shadcn/ui Examples

The independent manual [Official Visual Audit](../.github/workflows/official-visual-manual.yml) workflow captures the rendered official shadcn/ui examples and the corresponding local Primitive Explorer previews. It never reinstalls source code. The older [bootstrap workflow](../.github/workflows/bootstrap-visual.yml) remains available separately.

## Priority coverage

The installation plan `shadcn-plan.json` declares **50 primitives**. The curated inventory `scripts/official-component-examples.json` now includes **all 50 official examples**, with **41 mapped Pi contracts** and **9 official-only references**. There are **0 unselected primitives**. The floor of 50 is enforced by `shadcn:official:inventory:check` and regression tests; new components must be added to the audit or explicitly recorded for pending review without lowering this floor.

The 12 previously missing priority examples are `aspect-ratio`, `kbd`, `empty`, `scroll-area`, `alert-dialog`, `attachment`, `bubble`, `context-menu`, `hover-card`, `item`, `marker`, and `message`. Each has an existing Pi contract and sample; **no API, Zod schema, admission state or Pi permission was changed** to extend the audit.

Former Galleries 1 and 2 were removed; historical 64-card comparisons are not a current quality gate. ReUI remains a separate React composition library.

## Execute and inspect

With dependencies, Chromium and the official documentation site reachable:

~~~bash
npm run shadcn:official:inventory:check
npm run test:offline
npm run shadcn:official:capture
python3 -m pip install Pillow==11.3.0
npm run shadcn:official:compare -- --strict
~~~

Alternatively, run **Actions → Official shadcn visual audit (manual)** on `main`. For each example, Playwright attempts a real screenshot of the official source and — when a Pi contract exists — a local preview at **desktop and mobile** viewport sizes. The expected matrix is **100 cases: 82 compared source/local cases and 18 official-only cases**. Reports in `reports/official-components/comparison.json`, `index.html`, the screenshots and provenance are uploaded together, including failures.

A passing inventory check only proves that the 50 examples have been selected and reconciled. A passing strict comparison proves that actual screenshots and traceable source provenance were collected, **not** that the implementations look equivalent. The local and upstream demos often use different content, themes and states. The diagnostic difference percentage must never act as a pass threshold or visual certificate. The `visualApproval` field remains `pending` until the real capture comparison report is complete, then signals **human review required**, not approval.

## Manual visual review still required

Inspect desktop/mobile side by side and document deviations in spacing, typography, hierarchy, responsive behavior, clipping and interactive overlay states (especially AlertDialog, ContextMenu and HoverCard). The initial-state captures alone do not certify these interaction states or accessibility. A reviewer's explicit decision is still required for fidelity claims; selecting an example is **not** an approval.

See [development](development.md), [components](components.md), and [composition review](revisao-visual-shadcn.md).
