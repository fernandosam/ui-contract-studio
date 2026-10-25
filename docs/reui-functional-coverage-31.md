[English](reui-functional-coverage-31.md) | [Português](reui-functional-coverage-31.pt-BR.md)

# ReUI Functional Coverage — 31 Families, 559 Local Examples

> **Status: partial implementation; complete functional certification pending.**
> The inventory includes all 31 families and 559 versioned TSX examples. This **does not**
> establish full functional or visual parity with ReUI. Static inspection
> identifies capabilities; only browser tests and interaction evidence can
> certify individual examples. Newly published upstream examples do not
> automatically belong to this versioned snapshot.

## Coverage model

1. **Zod primitive:** reusable properties, serializable data, safe local state, and authorized events. Contracts do not accept JSX, arbitrary CSS, or AI-provided callbacks.
2. **ReUI React composition:** local `c-*-*.tsx` examples retain their layouts, interactions, and imports from other primitives. They are available in the explorer, **not** automatically new Pi types.
3. **Dedicated semantic contracts:** `OnboardingChecklist`, `RatingDistribution`, and `CharacterCountTextarea` were separately admitted with Zod and an adapter.
4. **Not admitted:** external media without an authorized source, transactional operations, login/account flows, persistence, or undeclared actions.

## Coverage by family

| Family | Examples | Functional representation and evolution | What must not become an unrestricted prop |
|---|---:|---|---|
| Accordion | 11 | Existing single/multiple expansion, expanded state, indicators, and appearance | Nested content, avatars, and checklists are compositions |
| Alert | 20 | **New:** optional title/icon, typed tones, and local dismissal | Action buttons and notices with external identity |
| Avatar | 35 | **New:** shape, indicator placement, fallback, dimensions, and local presence | External images, groups, badges, and account menus |
| Badge | 25 | **New:** tones, solid/soft/outline appearance, sizes, and dot | Links, removal, and images require composition |
| Button | 61 | Previously admitted official variants/sizes, loading, counts, and icons | Copy, social login, theme, and split actions need state/flows |
| ButtonGroup | 57 | **New:** uniform variants/sizes and safe icons; demo selection and orientation | Inputs, menus, multiple commands, and transactions |
| Card | 18 | **New:** textual footer alongside slots and width limits | Multimedia layouts and composed buttons |
| Carousel | 11 | Existing loop, arrows, indicators, density, and orientation | External media, thumbnails, and autoplay |
| Checkbox | 22 | **New:** description and invalid state alongside checked, required, and disabled | Groups, terms cards, and submission |
| Collapsible | 10 | Existing disclosure and declared slots | Trees and complex internal controls |
| Dialog | 10 | Existing controlled opening and slotted content | Forms, confirmations, and remote submissions |
| Drawer | 5 | Existing direction, opening state, and slots | Workflows and unauthorized internal components |
| DropdownMenu | 18 | Existing separators, labels, checkbox, and one-level submenu | Accounts, workspaces, remote sources, and transactions |
| Input | 31 | **New:** help, aria-invalid, and maxLength | Global search, uploads, and composed add-ons |
| Pagination | 15 | Existing page window, jump, first/last, and page size | Real queries, remote pagination, and URL state |
| Popover | 11 | Existing opening, alignment, and textual content | Forms and rich selection require compositions |
| Progress | 8 | **New:** state tones and optional value display | Timed steps and composed bars |
| RadioGroup | 17 | **New:** per-option text description; exclusive selection, disabled, and orientation | Pricing cards, payments, and avatars |
| Select | 33 | **New:** labeled groups and option descriptions | Avatars, URL-based flags, filtering, and multimedia |
| Separator | 6 | **New:** centered text label | Complete information blocks between dividers |
| Skeleton | 10 | **New:** shapes and bounded line count; existing dimensions | Entire card, chat, and table templates |
| Slider | 12 | **New:** 1–3 thumbs, ranges, steps, and values | Gradients, rich ticks, increment controls, and emojis |
| Spinner | 12 | **New:** tones and screen-reader-only labels | Overlays and composed buttons |
| Switch | 14 | **New:** sm/default size and accessible description | Preferences cards, rich help, and persistence |
| Table | 17 | **New:** empty state, compact density, and stripes | Sorting/editing/filtering: use DataTable |
| Tabs | 9 | **New:** text panels, line list variant, and disabled per tab | React form panels, routing, and nested tabs |
| Textarea | 6 | **New:** help, invalid, and maxLength | Dynamic counter: CharacterCountTextarea |
| Toggle | 14 | **New:** allowlisted icons; pressed state, size/variant, and event | Counts, rich icons, tooltips, and combinations |
| ToggleGroup | 16 | **New:** allowlisted icons and per-item disabled state | Rich items and external actions |
| Tooltip | 16 | **New:** trigger icon and text shortcut | Avatar content and rich actions |
| Rating | 9 | **New:** half-star selection and visible value; fractional display | Half-star interactivity, review submission, and face scales |
| **Total** | **559** | **31 families with versioned React examples; 22 distinct base contracts evolved in this round** | **Complete fidelity still not certified** |

## Existing evidence and completion criteria

- `npm run reui:audit:check` reads all 559 TSX files and checks the source snapshot/hash. The audit extracts recurring properties, state, and integration signals but does not run browser interactions.
- `tests/reui-family-functional-coverage.integration.test.ts` checks the correspondence of 31 families to 559 sources, acceptance of 14 initial property groups by Zod and 8 complementary groups, and rejection of invalid attributes.
- `tests/e2e/reui-gallery-full.spec.ts` checks browser rendering of all 559 examples across 31 families without preview fallbacks, **when executed**. Under project policy, it runs manually on `main`.
- Certification also requires **real click/keyboard/state scenarios, ARIA, focus navigation, responsiveness, and visual review with real screenshots per variation**. PR CI cannot substitute for this.
- The **8 deferred-semantic**, **15 existing-contract-gap**, **22 existing-composition**, **3 approved-semantic**, and **511 existing-primitive-variant** decisions remain traceable in `src/ui-catalog/reui-semantic-admissions.json`. These are architectural classifications, **not** claims that each variation has been certified.

## Remaining requirements for 100% certification

1. Exercise each example's real interactions (not just rendering), with reproducible evidence by `exampleId`.
2. Resolve contract gaps from the decision matrix individually, without admitting policy-blocked behavior.
3. Compare each variation with the upstream reference, including visuals, keyboard, screen readers, and responsive states.
4. Submit the proposed `2.1.0` versions for independent review; the versioned lock is an audit trail, not self-approval.
