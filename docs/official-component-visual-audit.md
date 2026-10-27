[English](official-component-visual-audit.md) | [Português](official-component-visual-audit.pt-BR.md)

# Visual Comparison with Official shadcn/ui Examples

The lightweight manual [Official Visual Audit](../.github/workflows/official-visual-manual.yml) workflow captures rendered examples from the shadcn/ui documentation and the mapped local previews in the Primitive Explorer.

The older [Bootstrap and Visual Audit](../.github/workflows/bootstrap-visual.yml) remains available when reinstalling primitives is explicitly necessary; the new audit workflow never reinstalls components or rewrites source files.

## Scope and sources

- The `shadcn-plan.json` **installation plan** contains 50 planned/local primitives.
- The `scripts/official-component-examples.json` **curated inventory** defines **38 selected official examples** (29 mapped Pi contracts and 9 official-only examples). The other **12 installed primitives are explicitly tagged as pending visual review**, not as visually approved. These counts serve different purposes.
- All 50 planned primitives must be reconciled against either selected examples or explicit exclusions with review reasons. The floor of 38 selected examples cannot be silently reduced; future audited examples can be moved from the pending list into the selected set.
- Currently pending: `aspect-ratio`, `kbd`, `empty`, `scroll-area`, `alert-dialog`, `attachment`, `bubble`, `context-menu`, `hover-card`, `item`, `marker`, `message`.
- Not all primitives have an isolated Pi contract. The inventory records which examples have a local counterpart; **do not invent counterparts** for components without contracts.

Former **Galleries 1 and 2** were removed from the product; reports and methods related to the old 64 shadcn/create cards are **historical**, not current operational criteria. ReUI is a separate library of React examples.

## Manual execution

With actual dependencies and a browser installed:

~~~bash
npm run shadcn:official:inventory:check
npm run shadcn:official:capture
python3 -m pip install Pillow==11.3.0
npm run shadcn:official:compare -- --strict
~~~

Playwright captures the official reference and corresponding local preview, when available, on desktop/mobile. Inspection artifacts are published in `reports/official-components/`, including `index.html` and `comparison.json`.

## How to interpret results

Captures with different sizes, fonts, content, and states produce numerical differences that are **diagnostic only**. Coverage checks fail for a missing reference, capture, invalid origin, invalid Pi mapping, duplicate, or an unaccounted-for primitive. **Passing does not prove pixel-for-pixel fidelity or certify excluded primitives.** Visual approval requires equivalent fixtures and documented human review.

See [development](development.md), [components](components.md), and [composition review](revisao-visual-shadcn.md).
