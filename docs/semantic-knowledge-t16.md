[English](semantic-knowledge-t16.md) | [Português](semantic-knowledge-t16.pt-BR.md)

# T16 — Delivery 3 (P2): Collapsible, Carousel and Rating

**Reviewed:** 2026-10-27. References: [T01 checklist](semantic-knowledge-checklist.md), `src/ui-catalog/knowledge/alert-dialog.json` and the official ReUI documentation for [Collapsible](https://reui.io/components/collapsible), [Carousel](https://reui.io/components/carousel) and [Rating](https://reui.io/components/rating).

## Traceability matrix

| Overlay | Implemented static / unimplemented / runtime review | Code evidence excerpts | Candidate integrations | FAQ decisions | Derived test cases |
| --- | ---: | ---: | ---: | ---: | ---: |
| `collapsible.json` | 5 / 3 / 2 | 15 | 8 | 7 | 9 |
| `carousel.json` | 7 / 4 / 3 | 24 | 10 | 9 | 11 |
| `rating.json` | 7 / 4 / 3 | 20 | 10 | 10 | 11 |
| **Total** | **19 / 11 / 8** | **59** | **28** | **26** | **31** |

All 59 exact evidence excerpts were checked against versioned `src/` files on GitHub on 2026-10-27. Text matching **does not certify runtime behavior, complete functional correctness or new API admission**. Individual offline tests (`tests/semantic-t16-<component>.test.mjs`) verify metadata, source and review date, capability classification, gap coverage, rejection of fabricated evidence, prevention of promotion without evidence and advisory-only Pi projections.

## Implementation boundaries identified from source code

- **Collapsible:** approved contract supports `title/open/defaultOpen/disabled`, a `default` slot, and an `openChange` notification. The Base UI trigger uses `render`; neither tree navigation, URL synchronization, custom animation nor persistence is granted.
- **Carousel:** approved Pi items are textual `title/description` (up to 50), with `orientation`, `loop`, `slidesPerView`, arrows, dots and `ariaLabel`. ReUI demo images, thumbnails, autoplay and Embla APIs do not expand this JSON contract. Dots represent *scroll snaps*, and the wrapper handles only ArrowLeft/ArrowRight, even in vertical mode.
- **Rating:** the Pi renderer uses buttons with `aria-pressed`, supports `step=0.5`, displays fractional values and emits payload-free `change`. The separate ReUI preview adapter uses `div onClick` without keyboard support. A derived accessibility case captures this gap; do not assume native radio inputs or review submission.

## Required CI verification

The pull request runs the following commands in `.github/workflows/quality.yml`:

```bash
npm run semantic:check
npm run semantic:report
npm run docs:check
npm run test:offline
```

**Review record:** 59/59 literal evidence fragments were located, and derived-test links were checked against capability IDs. The first CI run passed both semantic commands; the offline job detected an additional bilingual-document inventory requirement, addressed by adding this English counterpart and updating the expected document inventory. The complete suite must only be marked as passed after the follow-up workflow finishes. The derived `reports/composition-analysis/semantic-knowledge.json` is ignored by Git and must never be used as an admission manifest.

## Safety and scope

Only the three per-component JSON overlays, three independent offline test files, this bilingual audit note and the pre-existing bilingual-document inventory assertion are modified. Zod schemas, `src/ui-catalog/catalog.ts`, `src/ui-catalog/extensions/catalog.ts`, locked contracts, Pi permissions, `pi-catalog/`, admission machinery, runtime components and backend actions are untouched. Nonimplemented features remain `candidate-not-executable`; runtime-dependent features await genuine browser and assistive-technology review. Integrations are `advisory-only`, not granted permissions.
