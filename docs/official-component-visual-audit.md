[English](official-component-visual-audit.md) | [Português](official-component-visual-audit.pt-BR.md)

# Visual Comparison with Official shadcn/ui Examples

The manual [Official Bootstrap and Visual Audit](../.github/workflows/bootstrap-visual.yml) workflow captures rendered examples from the shadcn/ui documentation and the mapped local previews in the Primitive Explorer.

## Scope and sources

- The `shadcn-plan.json` **installation plan** contains 50 planned/local primitives.
- The `scripts/official-component-examples.json` **comparison inventory** defines **38 official examples** for capture. These counts serve different purposes and must not be treated as a mismatch.
- Not all primitives have an isolated Pi contract. The inventory records which examples have a local counterpart; **do not invent counterparts** for components without contracts.

Former **Galleries 1 and 2** were removed from the product; reports and methods related to the old 64 shadcn/create cards are **historical**, not current operational criteria. ReUI is a separate library of React examples.

## Manual execution

With actual dependencies and a browser installed:

~~~bash
npm run shadcn:official:capture
python3 -m pip install Pillow==11.3.0
npm run shadcn:official:compare -- --strict
~~~

Playwright captures the official reference and corresponding local preview, when available, on desktop/mobile. Inspection artifacts are published in `reports/official-components/`, including `index.html` and `comparison.json`.

## How to interpret results

Captures with different sizes, fonts, content, and states produce numerical differences that are **diagnostic only**. Coverage checks may fail because of a missing reference, capture, or provenance error, but **do not prove pixel-for-pixel fidelity**. Visual approval requires equivalent fixtures and documented human review.

See [development](development.md), [components](components.md), and [composition review](revisao-visual-shadcn.md).
