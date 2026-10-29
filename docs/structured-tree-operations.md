[English](structured-tree-operations.md) | [Português](structured-tree-operations.pt-BR.md)

# E08 — Structured JSON tree operations

**Status:** internal v1 API; no new Pi permissions, external execution, or persistence. Component, event and action contracts remain governed by the existing Zod catalog. This protocol edits already-valid `json-render` specs without introducing a second component schema.

## Wire format

A spec contains `root`, `elements` and optionally `state`. Each element is addressed by its stable ID in `elements`; parent-child links are stored in `children` and `slots.<name>` arrays. A patch has a **separate** `schemaVersion` and up to 50 ordered operations:

```json
{
  "schemaVersion": 1,
  "operations": [
    {
      "op": "add", "nodeId": "notice", "parentId": "root", "index": 0,
      "node": {"type": "Text", "props": {"text": "Notice"}, "children": []}
    },
    {"op": "update", "nodeId": "notice", "setProps": {"text": "Updated notice"}},
    {"op": "move", "nodeId": "notice", "parentId": "root"}
  ]
}
```

| Operation | Required fields | Semantics |
| --- | --- | --- |
| `add` | `nodeId`, `parentId`, `node` | Insert **one leaf node** with `type`, `props` and `children: []`. Optional `slots` must be empty arrays. No new `on` handlers or implicit IDs. |
| `remove` | `nodeId` | Detach and delete the **entire subtree**, including descendants referenced by slots, not just the parent reference. |
| `move` | `nodeId`, `parentId` | Reattach the **same subtree** without changing element IDs or content. No cycles or root moves. |
| `update` | `nodeId`, `setProps` and/or `unsetProps` | Explicit shallow set/unset of **props only**. Cannot modify types, IDs, children, slots, events, visibility, repeat, or actions. |

`add` and `move` optionally accept `slot` (an **existing, declared** slot on the destination parent) and `index` (nonnegative integer). Omission inserts into `children` and appends. For `move`, indices address the **final array after detachment**. Root deletion/move, duplicate IDs, missing destinations, non-leaf additions and out-of-bounds indices are forbidden. Build larger subtrees with successive `add` operations.

## Execution and safety

The supported integration point is `applyPiTreePatch(spec, patch, "stable")` in `src/ui-runtime/tree-operations.ts`. It delegates to the side-effect-free `scripts/lib/spec-tree-operations.mjs` engine. The `experimental` channel must be chosen only by an already authorized caller; a patch never chooses or grants its own channel.

1. Check JSON input, strict operation fields, v1, 50-operation limit and reserved prototype-pollution keys. Reject non-JSON data and cycles.
2. Validate the initial tree **and after each edit** with the actual channel-specific **Zod catalog**, authorized types/events/actions/slots and the existing `graphErrors` policy (current limits: 300 nodes, depth 30). Explicitly reject undeclared slots. Run the independent layout safety and semantic flow checks before the operation can be committed.
3. Edit only a clone. On any error return `{ok:false,spec:<original>,error:{opIndex,code,message}}`. No partial mutation is observable. Success returns `{ok:true,spec:<new clone>,changes:[...]}`. Change summaries include IDs, positions and property names but not field values.
4. Never write files, render content, execute handlers, promote contracts or grant Pi permissions. Publication continues through the existing checks and authorization process.

These are **not RFC 6902 JSON Patch** operations: stable IDs and tree invariants replace blind positional paths. An invalid patch never falls back to JSX or HTML.

## Per-operation layout validation

The engine always checks structural layout invariants after Zod and graph checks: text-only `Text` and `Heading` cannot contain child nodes (which would become invisible in rendering), and a `Heading` cannot have an empty/whitespace-only title. An invalid initial tree or any intermediate operation returns `layout_invalid` (with `opIndex: null` for the initial spec). The **entire patch** is discarded, including preceding valid operations.

The trusted caller can bind a flow-specific layout plan without changing the patch protocol: `applyPiTreePatch(spec, patch, "stable", requirements)`, where `requirements` comes from the existing requirements engine for **registration, login, search, or dashboard**. The engine reuses `evaluateLayoutQuality` to reject only a fixed set of **deterministic structural contract deviations**: semantic region order, grouping, membership, grid density, container and responsive reading order. Unsupported explicit flow contexts fail closed.

The `layoutQuality` score and browser geometry remain **advisory only**; neither score thresholds nor visual heuristics are approval gates, and this validation does not certify real breakpoints, accessibility, or screenshots. If no flow context is supplied, only cross-screen layout invariants are checked—**no flow should be guessed** from IDs or untrusted JSON. A patch cannot provide or change its own validation policy. Layout failures never grant components, Zod props, handlers or Pi permissions, and diagnostics contain no prop/state values.

## Preservation guarantees

After **every** successful operation, a separate mutation-footprint audit compares the previous and proposed trees before accepting the result:

- The root, complete top-level `state`, and all other top-level fields remain unchanged. Patches never reset or migrate form state.
- Existing element IDs cannot be renamed or silently replaced. IDs removed earlier in **the same patch** (including newly added and then deleted IDs) cannot be reused; this fails with `id_reuse` and rolls back the whole batch.
- `add` inserts exactly its declared node; `remove` deletes only the explicitly selected subtree; `move` retains the complete payload and IDs of the moved subtree; `update` changes only the requested `props` keys.
- Only the explicitly affected `children` or `slots.<name>` lists may change, with their exact reference ordering verified. All unrelated sibling lists, slots, handlers, visibility, repeat metadata, props, and subtrees must match the previous tree.
- A mutation that escapes its declared footprint fails closed with `preservation_violation`. The existing graph validation additionally prevents dangling **structural** references after removals or moves.

Opaque ID-like strings in domain-specific `props` or `state` are **not** automatically interpreted as element references or rewritten. Such application-level relationships require their own explicit contract; this API preserves their values as-is and does not grant a new action or permission.

## Verification

`node --test tests/tree-operations.test.mjs tests/tree-preservation.test.mjs` tests offline behavior and preservation invariants, invalid operations, slots, cycles and rollback. `tsx --test tests/tree-operations.integration.test.ts` covers the real stable Zod catalog. Run `npm run test:offline`, `npm run validate` and `npm run build` in a fully provisioned environment.

### E08 regression suite (partial edits, conflicts and rollback)

Run `node --test tests/tree-edit-regression.test.mjs` without dependencies, or `tsx --test tests/tree-edit-regression.integration.test.ts` with project dependencies. Both are included in the existing `npm run test:offline` / `npm run test` globs, respectively. The offline suite exercises stable IDs, independent regions, event handlers, form state, slots, conflict rejection, non-leaking errors, stale previews and replay failures. Integration exercises the real stable Zod catalog and login layout contracts, checking that an invalid later edit rolls back earlier edits atomically. These are structural/contract regression tests; they do **not** replace the manual full browser E2E suite or demonstrate live interaction, visual fidelity, remote persistence, or new Pi authorization.
