[English](structured-tree-history.md) | [Português](structured-tree-history.pt-BR.md)

# E08 — JSON tree diff preview and revision history

This feature uses the [existing structured patch engine](structured-tree-operations.md) and channel-bound Pi/Zod validation. It does not introduce a second component schema, Pi permissions, remote actions, arbitrary JSX, external integrations, or persistence.

## User interface

Open **Examples and patterns** and find **Alterações estruturadas · E08** under the chosen screen or pattern. Edit a v1 patch containing `add`, `remove`, `move`, or `update` operations, then click **Pré-visualizar diferenças**. The proposed diff lists added/deleted IDs, explicit relocations, and affected property *names* without property values. An optional side-by-side live preview shows the before/after screens. **Aplicar prévia** remains disabled until validation succeeds.

**Desfazer** and **Refazer** traverse the local revision history. The default limit is 50 commits (configurable 1–100); older revisions expire when the limit is exceeded. Applying after undo drops the redo branch. Switching source examples resets the editing session. There is no disk save, remote audit trail, or multi-user synchronization.

## Internal API

```ts
import { createPiTreeEditSession } from "../src/ui-runtime/tree-edit-session";

const session = createPiTreeEditSession(spec); // stable channel unless trusted caller selects otherwise
const preview = session.preview({ schemaVersion: 1, operations: [
  { op: "update", nodeId: "title", setProps: { text: "New title" } },
] });
if (preview.ok) session.commit(); // revalidates and matches the staged result
session.undo();
session.redo();
const { spec: current, history, cursor } = session.read();
```

The pure factory is `createTreeEditSession(original, applyPatch, {maxEntries})` in `scripts/lib/spec-tree-history.mjs`. **Only a trusted host** can supply the validation callback and select an already authorized channel. Never derive a channel or action permission from generated JSON.

- Preview is side-effect free; rejected or net-no-op patches cannot be committed.
- Commit replays validation and requires identical output; no partial commits or stale previews.
- Undo/redo replay through the same validator and verify stored results. Revalidation failures leave the current revision intact.
- Public results are defensive copies. Diff/history summaries contain IDs, positions, and property *names*, not property values. Internal snapshots remain bounded and session-local. Live renderings and the current full JSON can display actual content and must **not** be logged as value-free summaries.
- The diff reports explicitly moved nodes, not every sibling whose array index shifts due to an insertion/deletion.

## Verification

Run `node --test tests/tree-history.test.mjs`, `tsx --test tests/tree-history.integration.test.ts`, `npm run test:offline`, `npm run semantic:check`, `npm run semantic:report`, `npm run validate`, and `npm run build` in a provisioned checkout. Tests cover invalid patches, history boundaries, redo invalidation, slots, IDs, state, revalidation, defensive copying, and value-free summaries.
