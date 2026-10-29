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
2. Validate the initial tree **and after each edit** with the actual channel-specific **Zod catalog** and the existing `graphErrors` policy (current limits: 300 nodes, depth 30). Explicitly reject undeclared slots.
3. Edit only a clone. On any error return `{ok:false,spec:<original>,error:{opIndex,code,message}}`. No partial mutation is observable. Success returns `{ok:true,spec:<new clone>,changes:[...]}`. Change summaries include IDs, positions and property names but not field values.
4. Never write files, render content, execute handlers, promote contracts or grant Pi permissions. Publication continues through the existing checks and authorization process.

These are **not RFC 6902 JSON Patch** operations: stable IDs and tree invariants replace blind positional paths. An invalid patch never falls back to JSX or HTML.

## Verification

`node --test tests/tree-operations.test.mjs` tests offline behavior, invalid operations, slots, cycles and rollback. `tsx --test tests/tree-operations.integration.test.ts` covers the real stable Zod catalog. Run `npm run test:offline`, `npm run validate` and `npm run build` in a fully provisioned environment.
