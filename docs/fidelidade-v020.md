[English](fidelidade-v020.md) | [Português](fidelidade-v020.pt-BR.md)

> **Historical record (v0.20):** numbers, gaps, and certification status refer to the audited snapshot, not necessarily the current release. See [architecture](architecture.md) and the [current visual review](revisao-visual-shadcn.md).

# Composition and Data Configuration Review — v0.20

## Scope and evidence

The review cross-referenced **118 composite components** already present in v0.19:

- 64 cards under `apps/v4/registry/bases/base/blocks/preview` and `preview-02` (code review previously documented in `create-reference-audit.json`);
- 27 blocks (dashboard, login, signup, and sidebars), derived from 103 files and 27 previews (`block-source-inventory.json`);
- 27 compositions from `apps/v4/components` (22 declarative and 5 stateful), documented in `site-compositions-audit.json`.

**What was actually verified:** inventories and TSX source references, previous examples, elements present in templates, published labels, and inspectable HTML preview pages; improvements to Activity Goal bars, a Cookie Settings default closer to the original, and message rendering in Sidebar09. All 118 components underwent automated analysis with source references and discrepancies recorded in `src/ui-catalog/composite-fidelity-audit.json`; **41 have label differences detected heuristically**, requiring manual review because they may reflect legitimate layout or localization differences.

**What was NOT verified:** the 118 local implementations were not captured and compared side by side with original screenshots, across light/dark themes and desktop/mobile. The audit marks all 118 as **pending**. No pixel-perfect claim is made; QR components, viewers, grids, and advanced charts remain adaptations and may need additional approved primitives.

## Typed per-node flexibility

The 113 declarative composites then supported `nodeProps`, generated per template in `src/ui-catalog/extensions/composites/generated-node-props.ts` with specific `.strict()` Zod schemas. This exposed **2,293 properties**, including **81 arrays/objects** (chart series, table rows, sidebar sections, options, etc.). The existing textual `content` property remained supported.

Example — Dashboard01:

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "Dashboard01",
      "props": {
        "title": "Painel personalizado",
        "nodeProps": {
          "b008": { "data": [{ "label": "Jan", "value": 28 }, { "label": "Feb", "value": 35 }] },
          "b009": { "rows": [["Overview", "Report", "Done", "8", "4", "Reviewer"]] },
          "b002": { "sections": [{ "label": "Projetos", "items": ["Em andamento", "Arquivados"] }] }
        }
      },
      "children": []
    }
  }
}
```

Protected properties: `type`, `children`, `on`, field identity (`name`), and external links/URLs (`href`, `src`, `sourceId`) cannot be replaced. The public Zod layer rejects unknown `nodeProps` keys; the compiled template is validated again by `catalog.validate()` before rendering. Data structures can change **only within primitive contract limits** (e.g., valid columns/rows and charts with at least one point).

The five stateful components kept their semantic APIs. `SiteCardsActivityGoal` accepts `chartValues`, `goal`, `minimum`, `maximum`, `step`, and `showBarChart`; Cookie Settings accepts `showOptionalCookies` and optional switches. There is no remote submission, cookie writing, or actual authorization.

## Verification workflow

```bash
npm run composites:node-props:check
npm run composites:generated:check
npm run composites:fidelity
npm run test:offline
# On WSL, after installing dependencies:
npm run pi:zod-schema
npm run validate
npm run build
npm run composites:capture
npm run composites:compare
```

For reference captures, visit the audit URLs and save images under `reports/composite-fidelity/reference/<Tipo>.png`. Playwright generates local desktop captures under `reports/composite-fidelity/local/<Tipo>.png` and mobile captures under `local/mobile/`. Compare them in `reports/composite-fidelity/compare.html`. After actual inspection with comments, add each composition's name, reviewer, date, observations, and `approved` status to `src/ui-catalog/composite-visual-approvals.json`. `npm run composites:fidelity:strict` **does not pass** while items or evidence remain pending.

Without `node_modules` and local shadcn components, offline tests verify structure, integrity, examples, and the pure compiler; they **do not** certify full TypeScript, React in a browser, or exact similarity to the preview.
