[English](layout-reuse.md) | [Português](layout-reuse.pt-BR.md)

# E05 — Auditable structural reuse in approved JSON layouts

The versioned evidence index is [`src/ui-requirements/layout-reuse-evidence.json`](../src/ui-requirements/layout-reuse-evidence.json). It is **derived** from `src/ui-patterns/*.json` paired with `*.meta.json`, not from generated JSX or visual resemblance. Only metadata explicitly declaring `approved: true`, `immutableContracts: true`, a matching `sourceRoot`, and a nonempty `originScreen` is included. The report checks every included tree against the existing contract-lock type inventory and structural invariants. Here, "approved" refers to the existing catalog metadata, **not verified independent human approval**.

## Method and findings

The analyzer counts **adjacent parent–child type pairs** (including their `children` or named `slots.*` relationship), intentionally ignoring changing node IDs and content properties. Every occurrence records its approved pattern, origin label, JSON file, metadata file, parent ID, child ID, relationship and child index. A pattern appearing twice within one layout does **not** count as reuse. Distinct pattern IDs sharing one `originScreen` are **tentative candidates** rather than cross-origin evidence. The origin labels come from metadata; the tool does not assert that an original historical screen is still available.

In the E05 baseline of eight approved patterns, three two-node structures recur across distinct source labels:

| Structure | Approved patterns | Origin labels |
| --- | --- | --- |
| `Card → Stack` | `detail-view`, `form-dialog` | `dashboard`, `playground` |
| `Card → Table` | `crud-list`, `detail-view` | `usuarios`, `dashboard` |
| `Stack → Link` | `detail-view`, `form-dialog` | `dashboard`, `playground` |

`Card → Grid` and `Grid → Card` occur in multiple patterns but have only one origin label each; they are retained as same-origin candidates. These are **structural hints, not complete reusable components**. They do not demonstrate equivalent semantics, actions, responsive quality, actual reuse in production, accessible behavior, screenshots or independent visual certification. No hierarchy, contract, component or permission may be promoted automatically from these counts.

## Refresh and verification

```sh
npm run patterns:reuse:check   # fails if the committed snapshot is stale
npm run patterns:reuse:report  # same check + writes reports/layout-reuse/evidence.json
npm run patterns:reuse:update  # explicitly refreshes the reviewed snapshot
npm run test:offline
npm run semantic:check
npm run semantic:report
```

Review source and snapshot differences when refreshing. The existing `npm run check` gate includes the evidence check; the existing quality workflow uploads the runtime report with semantic evidence. `--report` does not mutate the versioned index, and `--write` requires deliberate execution. The analyzer neither edits `pi-catalog/contracts.json` nor grants new Zod properties, admitted components, actions, permissions or publication decisions.

For stronger claims, follow up with human review of the structures and targeted browser/accessibility evidence bound to the actual implementation. Full E2E is not inferred by this offline scan.

## E05 catalog comparison — avoid duplicate compositions

The follow-up analyzer compares **all five** E05 structural candidates with approved base primitives from the contract lock and the **37 active, reviewed JSON composite templates** referenced by `generated-manifest.json`:

| Candidate edge | Scope | Existing JSON templates | Recommendation |
| --- | --- | --- | --- |
| `Card → Stack` | Cross-origin | Present (e.g. `Login01`, `Signup01`, `SiteCardsForms`) | Inspect these compositions before proposing any new one |
| `Card → Table` | Cross-origin | `Dashboard01`, `Sidebar09` | Inspect these compositions first |
| `Stack → Link` | Cross-origin | No static template edge found | Compose the existing `Stack` and `Link` primitives |
| `Card → Grid` | Same-origin only | Present (e.g. `Dashboard01`, `SiteCardsStats`) | Tentative only; inspect existing templates |
| `Grid → Card` | Same-origin only | No static template edge found | Tentative only; compose approved primitives |

```sh
npm run patterns:reuse:compare:check   # deterministic offline validation; no files changed
npm run patterns:reuse:compare:report  # same validation + reports/layout-reuse/comparison.json
```

The report records source layout IDs, approval-origin status, primitive contract references, and each matched composite's **file, parent/child node IDs, relationship and position**. It considers one composite only once regardless of how many matching edges appear inside that template. It runs as part of the existing `npm run check` and quality workflow; no new approval workflow exists.

A two-node structural match **does not prove** substitutability, equivalence of props/state/events, accessibility or visual quality. The comparison currently indexes only manifest-backed reviewed JSON templates, not arbitrary TSX/ReUI implementations. A missing match does **not** authorize a new component: try assembling existing primitives and request separate review for any genuinely missing capability. This process never changes Zod schemas, Pi permissions, published contracts, or Admission Engine decisions.
