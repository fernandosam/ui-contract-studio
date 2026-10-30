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


## E05 composition proposals — candidate interfaces, not admission

[`scripts/report-layout-composition-proposals.mjs`](../scripts/report-layout-composition-proposals.mjs) converts the **verified** E05 evidence and catalog comparison into five traceable proposals. Each record provides:

- **Purpose:** an explicit hypothesis for the observed grouping, subject to actual user-flow validation; not proof of behavioral equivalence.
- **Properties:** schema-declared properties of the **existing parent and child primitives** in `pi-catalog/props-json-schema.json`, with types, required flags, schema pointers and exact occurrences of observed keys. Screen values are not copied. These are **not** automatically new composite-level props.
- **Slots:** proposed `content` mapped to `parent.children` (or an observed `parent.slots.*`) and optional `nestedContent` mapped to `child.children`, including observed child counts. These labels are **not admitted Zod slots**.
- **Dependencies:** approved base contracts with pinned versions and fingerprints, plus existing approved composite templates to inspect for duplication. Layout source files, node IDs and positions remain auditable.

| Edge | Generated strategy | Rationale |
| --- | --- | --- |
| `Card → Stack` | `review-existing-compositions-first` | Matching reviewed JSON templates exist; inspect for safe reuse |
| `Card → Table` | `review-existing-compositions-first` | Matching reviewed JSON templates exist |
| `Stack → Link` | `compose-admitted-primitives` | Both primitives exist but no matching reviewed JSON template |
| `Card → Grid` | `observe-until-independent-origins` | Same declared origin only |
| `Grid → Card` | `observe-until-independent-origins` | Same declared origin only |

```sh
npm run patterns:reuse:proposals:check    # read-only deterministic check
npm run patterns:reuse:proposals:report   # writes reports/layout-reuse/proposals.json
node --test tests/layout-composition-proposals-e05.test.mjs
npm run semantic:check
npm run semantic:report
```

`npm run check` includes the validation and the existing quality workflow uploads `proposals.json` alongside semantic reports, with no extra approval layer. Source evidence is recalculated and compared to its reviewed index before generating proposals; invalid source nodes and undeclared primitive properties fail closed. The output is **advisory**: no Zod, catalog, lock, Pi permissions, template, or Admission Engine admission/publishing mutations. Any actual new composite still requires semantic, behavioral, visual, accessibility and independent admission review.


## E05 proposal validation — Zod, contract lock and Admission Engine

After proposal generation, run the **read-only** validator against the authoritative catalog and admission policy:

```sh
npm run patterns:reuse:validate:check    # fail-closed, no files written
npm run patterns:reuse:validate:report   # write reports/layout-reuse/validation.json
npx tsx --test tests/layout-proposal-validation-e05.integration.test.ts
npm run semantic:check
npm run semantic:report
```

The validator reparses approved source screens with the **real stable Pi Zod catalog**, validates every observed primitive's properties with the actual `componentDefinitions[type].props.safeParse` and compares the exported property schemas to `z.toJSONSchema` at runtime. It checks observed-property source pointers, proposed slot cardinalities, pinned primitive versions/fingerprints and the official Pi v3 manifest. The existing `evaluatePolicy` gate is reused to reject invalid Admission Engine policy; candidate IDs must not collide with allowlists, recipes, entries, protocols, CI auto-admission or published types. No new engine decision or protocol is manufactured.

A **passing validation proves only that the advisory proposal describes the approved sources and contracts accurately**. It does not approve new composite props, candidate slots, runtime actions, renderer code, browser E2E, accessibility or stable promotion. The report explicitly records `canPublish: false`, `canExecuteAsComposite: false`, `canGrantPiPermissions: false`, and `e2eCertification: not-performed` for every proposal. A changed or forged source/policy fails closed. The existing quality job validates with installed Zod and preserves the report as a CI artifact, without adding a new approval layer or touching the Pi registry.


## E05 functional equivalence, regression and provenance tests

The E05 verifier tests all five candidate edges and all **16 observed occurrences** against their reviewed JSON sources, metadata, explicit parent/child indices, declared origins, and existing composition references. It also pins the original eight approved layouts and their metadata using Git blob SHA-1 in [`layout-reuse-regression-baseline.json`](../src/ui-requirements/layout-reuse-regression-baseline.json). Any edit to a pinned source/metadata file fails the gate until the change is reviewed and its hash deliberately updated. The baseline is not generated implicitly by the quality job.

```sh
npm run patterns:reuse:verify:check     # read-only; blocks provenance and baseline drift
npm run patterns:reuse:verify:report    # writes reports/layout-reuse/traceability.json
node --test tests/layout-reuse-verification-e05.test.mjs
npm run semantic:check
npm run semantic:report
```

The machine-readable report records each candidate/occurrence with layout path, metadata path, origin, node IDs, relation and index. It includes SHA-256 fingerprints of the full JSON graph, pair-level declarative properties/state and primitive properties, without copying sensitive contents into the report. Negative tests cover altered props, state, nested content, reordered children, missing/duplicated references, incorrect origin metadata, changed approved sources and forged permissions/functional-equivalence claims. The same quality workflow publishes `traceability.json` alongside the existing semantic reports, and `npm run check` enforces the read-only audit.

**Meaning of “equivalence”:** successful tests establish only traceable declarative fidelity to the *currently admitted primitives*. Existing matching JSON edges are not functionally interchangeable just because they share types. Since no new E05 composite implementation exists, the verifier explicitly records **zero certified functional equivalences**, `canReplaceExistingComponent: false`, and no authorization. Behavioral, keyboard, accessibility, responsive and visual E2E still require a real executable replacement and independent certification. No Zod, lock, Pi manifest, permissions, templates or Admission Engine policy are modified.

To intentionally update a reviewed baseline after a JSON/metadata change, inspect the exact diff and update only the corresponding source and metadata Git blob hashes (for example with `git hash-object src/ui-patterns/<id>.json` and its `<id>.meta.json`). Run the offline verification, `semantic:check` and `semantic:report` before accepting. Do not treat an updated hash as a behavioral approval.
