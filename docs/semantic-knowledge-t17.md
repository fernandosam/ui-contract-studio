[English](semantic-knowledge-t17.md) | [Português](semantic-knowledge-t17.pt-BR.md)

# T17 — Delivery 3 (P2): Alert, Card, Textarea, Progress

**Documentary review:** 2026-10-27. Baseline: [T01 checklist](semantic-knowledge-checklist.md) and `src/ui-catalog/knowledge/alert-dialog.json`. Original ReUI documentation: [Alert](https://reui.io/components/alert), [Card](https://reui.io/components/card), [Textarea](https://reui.io/components/textarea), [Progress](https://reui.io/components/progress).

## Evidence and scope matrix

| Overlay | Implemented / not implemented / runtime review | Exact code excerpts | Candidate integrations | FAQ | Derived cases |
| --- | ---: | ---: | ---: | ---: | ---: |
| `alert.json` | 5 / 3 / 2 | 12 | 8 | 7 | 8 |
| `card.json` | 4 / 4 / 2 | 13 | 9 | 7 | 8 |
| `textarea.json` | 6 / 3 / 2 | 20 | 8 | 7 | 9 |
| `progress.json` | 5 / 4 / 2 | 14 | 8 | 8 | 10 |
| **Total** | **20 / 14 / 8** | **59** | **33** | **29** | **35** |

Every static evidence substring was checked literally against versioned `src/` files fetched from the GitHub repository during authoring. **A substring match does not establish runtime behavior, Pi admission, backend authorization, visual certification or real E2E evidence.** Each overlay has an independent `tests/semantic-t17-<slug>.test.mjs` (4 offline cases per file). The tests cover T01 structure, exact evidence, static versus candidate/runtime classification, test-to-capability links, malformed evidence, and advisory-only Pi projections.

## Key findings and boundaries

- **Alert:** Pi supports title/description, default/destructive surface, tone-specific icons and local dismissal. The installed primitive always renders `role="alert"`, including nonurgent messages. There is no Pi `role="status"`, `AlertAction` or remote retry; dismissal simply unmounts local state. Review live announcements and small viewport behavior.
- **Card:** Pi supports textual header/description/footer, an approved default body slot, size, maxWidth and centering. `CardAction` exists in React only. Clickable-card behaviors, rich media and structured footer actions are not admitted. Validate grid density and keyboard semantics in a browser.
- **Textarea:** Pi supports name/label, help, native maxLength, rows, local change, and native disabled/required/readOnly/invalid states. A separate `CharacterCountTextarea` extension does not give the base Pi Textarea a counter. CSS `field-sizing-content` can override row-based sizing, notably in Chromium. Runtime height, error announcements and long text need verification.
- **Progress:** Pi needs numeric `value` (0..100), accepts positive `max`, maps five tones, and shows a value/max count by default. The bar uses normalized, clamped percent. If value exceeds max, count and filled track may disagree. Base UI Label/Value parts exist in React, not the Pi adapter. Indeterminate mode, uploads, ETA and cancel/pause have no Pi admission.

## Verification

The pull request triggers the quality workflow `.github/workflows/quality.yml`, which executes:

```bash
npm run semantic:check
npm run semantic:report
npm run docs:check
npm run test:offline
```

**At authoring:** 59 textual evidence excerpts checked against GitHub source; the 16 new offline cases have been added to the PR. The full four-command suite must be reported as passed **only after CI confirms it**. The derived report `reports/composition-analysis/semantic-knowledge.json` is intentionally ignored in Git, not a Pi authority.

## Change boundary

The T17 diff is limited to four JSON overlays, four independent offline tests, this bilingual audit note, documentation index entries and the bilingual document count assertion. No changes to `catalog.ts`, `extensions/catalog.ts`, Zod schemas, `contracts.lock.json`, `pi-catalog/`, admission records, runtime React components or Pi permissions. Candidate features remain unimplemented; runtime review remains pending.
