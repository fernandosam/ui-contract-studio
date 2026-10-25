[English](shadcn-upstream-coverage.md) | [Português](shadcn-upstream-coverage.pt-BR.md)

> **Point-in-time snapshot, October 23, 2026:** PR status, local sources, and components reflect the report date. For the current version, consult [components](components.md), [shadcn integration](integracao-shadcn.md), and repository manifests.

# Official shadcn/ui Coverage — October 23, 2026

Reference: https://ui.shadcn.com/docs/components.md — 66 official entries.
Local files in this proposal: 53. Missing files: 13.

Local source code does not imply a json-render contract. Twelve components were provided with official source, a strict Zod schema, an adapter, a sample, provenance record, and Explorer entry. Independent review and checks remained pending at the time.

| Name | Local source | Status |
|---|---|---|
| Accordion | Yes | Source already present; verify contract |
| Alert | Yes | Source already present; verify contract |
| Alert Dialog | Yes | Adapted official Base UI source and contract under review in PR #46 |
| Aspect Ratio | Yes | Proposed on this branch |
| Attachment | Yes | Adapted official Base UI source and contract under review in PR #46 |
| Avatar | Yes | Source already present; verify contract |
| Badge | Yes | Source already present; verify contract |
| Breadcrumb | Yes | Source already present; verify contract |
| Bubble | Yes | Adapted official Base UI source and contract under review in PR #46 |
| Button | Yes | Source already present; verify contract |
| Button Group | Yes | Source already present; verify contract |
| Calendar | Yes | Source already present; verify contract |
| Card | Yes | Source already present; verify contract |
| Carousel | Yes | Source already present; verify contract |
| Chart | No | Pending admission/installation |
| Checkbox | Yes | Source already present; verify contract |
| Code Block | No | Pending admission/installation |
| Collapsible | Yes | Source already present; verify contract |
| Combobox | Yes | Source already present; verify contract |
| Command | Yes | Source already present; verify contract |
| Context Menu | Yes | Adapted official Base UI source and contract under review in PR #46 |
| Data Table | No | Existing DataTable composition |
| Date Picker | No | Existing DatePicker composition |
| Dialog | Yes | Source already present; verify contract |
| Direction | No | Pending admission/installation |
| Drawer | Yes | Source already present; verify contract |
| Dropdown Menu | Yes | Source already present; verify contract |
| Empty | Yes | Proposed on this branch |
| Field | Yes | Source already present; verify contract |
| Hover Card | Yes | Adapted official Base UI source and contract under review in PR #46 |
| Input | Yes | Source already present; verify contract |
| Input Group | Yes | Source already present; verify contract |
| Input OTP | No | Pending admission/installation |
| Item | Yes | Adapted official Base UI source and contract under review in PR #46 |
| Kbd | Yes | Proposed on this branch |
| Label | Yes | Source already present; verify contract |
| Marker | Yes | Adapted official Base UI source and contract under review in PR #46 |
| Menubar | No | Pending admission/installation |
| Message | Yes | Adapted official Base UI source and contract under review in PR #46 |
| Message Scroller | No | Pending admission/installation |
| Native Select | Yes | Source already present; verify contract |
| Navigation Menu | No | Pending admission/installation |
| Pagination | Yes | Source already present; verify contract |
| Popover | Yes | Source already present; verify contract |
| Progress | Yes | Source already present; verify contract |
| Questionnaire | No | Pending admission/installation |
| Radio Group | Yes | Source already present; verify contract |
| Resizable | Yes | Source already present; verify contract |
| Scroll Area | Yes | Proposed on this branch |
| Select | Yes | Source already present; verify contract |
| Separator | Yes | Source already present; verify contract |
| Sheet | Yes | Source already present; verify contract |
| Sidebar | Yes | Source already present; verify contract |
| Skeleton | Yes | Source already present; verify contract |
| Slider | Yes | Source already present; verify contract |
| Spinner | Yes | Source already present; verify contract |
| Switch | Yes | Source already present; verify contract |
| Table | Yes | Source already present; verify contract |
| Tabs | Yes | Source already present; verify contract |
| Textarea | Yes | Source already present; verify contract |
| Toast | No | Pending admission/installation |
| Toggle | Yes | Source already present; verify contract |
| Toggle Group | Yes | Source already present; verify contract |
| Tooltip | Yes | Source already present; verify contract |
| Trace | No | Pending admission/installation |
| Typography | No | Typeset documentation, not installable by default |

Do not mark additional entries as implemented just to inflate coverage. For each missing component: inspect official docs, classify recipe versus primitive, use the CLI where applicable, create schema/adapter/fixture/lock/tests, and obtain independent review.

## JSON Catalog / Explorer

- The Primitive Explorer contains 41 base contracts and 13 primitive-like extensions: Field, AspectRatio, Kbd, Empty, ScrollArea, AlertDialog, Attachment, Bubble, ContextMenu, HoverCard, Item, Marker, and Message (54 types).
- There are 53 files in `src/components/ui`, but the closed catalog does not automatically register all local sources.
- Official components with a local source but no standalone primitive contract in the Explorer: Breadcrumb, Calendar, Combobox, Command, InputGroup, Label, NativeSelect, RadioGroup, Resizable, Sheet, and Sidebar. They require admission if the base API does not cover their use.
- DataTable and DatePicker are already approved compositions; Typography is typography guidance, not a new contract by default.
- The twelve primitives added during this audit have guidance notes, usage limits, and official documentation in `src/ui-catalog/shadcn-guidance.json`.

## Components awaiting implementation

No local source file existed for: Chart, Code Block, Direction, Input OTP, Menubar, Message Scroller, Navigation Menu, Questionnaire, Toast (Sonner), Trace, and Data Table, Date Picker, and Typography. The last three must not result in empty files: DataTable and DatePicker already have compositions, while Typography is typography guidance.

For the others, assess dependencies and official Base UI patterns before admission. For example: Chart depends on Recharts; Input OTP on the input-otp package; Message Scroller and Questionnaire on @shadcn/react packages. Toast can reuse the already-integrated Sonner without duplicating the contract.

### Applied integration rules

Eight components in this phase were based on official TSX from `shadcn-ui/ui/apps/v4/registry/bases/base/ui/` and have strict Zod schemas, React adapters, and JSON examples. Confirmation/selection events cannot perform external actions without authorized handlers. Attachment status is representational only. This inventory does not claim visual certification: CI, accessibility, and independent review are still required.
