[English](revisao-compostos-v021.md) | [Português](revisao-compostos-v021.pt-BR.md)

> **Historical record (v0.21):** the totals in this review document removal decisions from that version. Consult [components](components.md) and current manifests before reusing the counts.

# Composite Component Review — v0.21

**Retention criterion:** the component creates an independent semantic model, a recognizable workflow/state/event, or a reusable, selectable page layout pattern. **Removal criterion:** it merely groups existing primitives within a Card/Stack/Alert without its own API or behavior.

The review was deliberately conservative: 118 previous compositions were examined by architecture and template; 22 wrappers were removed and 96 kept. The 64 reference cards remain represented visually, although 10 ceased to be contracts and became inline trees in the relevant gallery. The 27 blocks remain because they provide separate, navigable page layouts. Removal is breaking for external clients still generating the retired names.

## Removed contracts and alternatives

| Contract | Reason | Migration |
|---|---|---|
| `IconPreviewGrid` | An icon grid has no API or behavior distinct from Grid + Icon. | Inline primitives in gallery |
| `LiveWaveformCard` | Shows a static BarGraph without live audio or a waveform API. | Inline primitives in gallery |
| `LoadingCard` | Merely groups Skeleton inside Card. | Inline primitives in gallery |
| `QrConnect` | Shows Image and Button without functional QR code or pairing. | Inline primitives in gallery |
| `Shortcuts` | Shows shortcut labels and buttons without registering commands or hotkeys. | Inline primitives in gallery |
| `SidebarNav` | Merely groups Link/Text without managed navigation. | Inline primitives in gallery |
| `SiteAnnouncement` | Badge + Text + Icon in Card without distinct behavior. | Approved primitive combination on demand |
| `SiteCallout` | Card wrapping Alert; primitive Alert already represents the functionality. | Approved primitive combination on demand |
| `SiteCardsCalendar` | Card wrapping DatePicker only. | Approved primitive combination on demand |
| `SiteCardsExerciseMinutes` | Card wrapping LineGraph only. | Approved primitive combination on demand |
| `SiteChartToolbar` | Tabs, Buttons, and LineGraph without a real chart editor. | Approved primitive combination on demand |
| `SiteCodeBlockCommand` | Tabs, Text, and Button without real copying or shell switching. | Approved primitive combination on demand |
| `SiteComponentPreview` | Tabs, Alert, and Button without real preview/code loading. | Approved primitive combination on demand |
| `SiteDirectorySearch` | Card, Input, and Button without running a search. | Approved primitive combination on demand |
| `SiteDocsBreadcrumb` | Stack of Text/Icon without semantic breadcrumbs/navigation. | Approved primitive combination on demand |
| `SiteDocsTableOfContents` | Static Text and Popover without syncing to a document. | Approved primitive combination on demand |
| `SiteSiteHeader` | Text and Button grouped without header navigation/state. | Approved primitive combination on demand |
| `SiteThemeSelector` | Select and Button without integration with the theme provider. | Approved primitive combination on demand |
| `SkeletonLoading` | Merely combines four Skeleton primitives. | Inline primitives in gallery |
| `StyleOverview` | Shows visual style samples using Text/Separator/Button only. | Inline primitives in gallery |
| `TypographySpecimen` | Illustrates typography and a text field only. | Inline primitives in gallery |
| `UIElements` | Demonstrates base controls without composite state. | Inline primitives in gallery |

## Exploration under the Tools menu

- **shadcn Primitives:** 41 base types and the Field primitive.
- **Composite Components:** 99 contracts (96 semantic compositions and the DataTable, DatePicker, and BlockSidebar adapters). Content properties and `nodeProps` remain subject to closed schemas.
- **Examples:** choose one of six screens or eight patterns, select any node, and adjust local props with Zod validation before rendering the complete tree.

## Integrity and limitations

Run `npm run composites:pruning:check`, `npm run test:offline`, `npm run pi:verify`, and, with connected npm, `npm run validate && npm run build && npm run test:e2e`. The audit result is recorded in `src/ui-catalog/composite-pruning-review.json`. Pixel-for-pixel visual matching was not confirmed; v0.20 already documented this process as pending.
