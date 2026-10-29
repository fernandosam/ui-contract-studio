import test from "node:test";
import assert from "node:assert/strict";
import { applyPiTreePatch } from "../src/ui-runtime/tree-operations";
import { createPiTreeEditSession } from "../src/ui-runtime/tree-edit-session";
import { catalog } from "../src/ui-catalog/catalog";
import { resolvePattern, generatePatternPreview } from "../src/ui-requirements/patterns";

const login = () => {
  const context = resolvePattern("login");
  return { context, spec: generatePatternPreview(context) };
};
const patch = (...operations: Record<string, unknown>[]) => ({ schemaVersion: 1, operations });
const updateNotice = (text: string) => ({
  op: "update", nodeId: "notice", setProps: { text },
});

test("E08 regression: partial edits under real Zod and login layout preserve every other node", () => {
  const { context, spec } = login();
  const original = structuredClone(spec);
  const result = applyPiTreePatch(spec, patch(updateNotice("Aviso revisado")), "stable", context);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const edited = result.spec as typeof spec;
  assert.equal(catalog.validate(edited).success, true);
  assert.equal(edited.elements.notice.props.text, "Aviso revisado");
  assert.equal(edited.root, original.root);
  assert.deepEqual(edited.state, original.state);
  assert.deepEqual(Object.keys(edited.elements).sort(), Object.keys(original.elements).sort());
  for (const id of Object.keys(original.elements)) {
    if (id !== "notice") assert.deepEqual(edited.elements[id], original.elements[id], id);
  }
  assert.deepEqual(spec, original);
});

test("E08 regression: real contextual layout conflict rolls back earlier valid edits", () => {
  const { context, spec } = login();
  const original = structuredClone(spec);
  const result = applyPiTreePatch(spec, patch(
    updateNotice("PRIVATE_INTERMEDIATE_VALUE"),
    { op: "move", nodeId: "notice", parentId: "root", index: 0 },
  ), "stable", context);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, "layout_invalid");
  assert.equal(result.error.opIndex, 1);
  assert.equal(result.spec, spec);
  assert.deepEqual(spec, original);
  assert.doesNotMatch(JSON.stringify(result.error), /PRIVATE_INTERMEDIATE_VALUE/);
});

test("E08 regression: schema and ID conflicts are atomic against the official stable catalog", () => {
  const operations = [
    [{ op: "update", nodeId: "notice", setProps: { secretProp: "SENSITIVE_VALUE" } }, "schema_invalid"],
    [{ op: "add", nodeId: "notice", parentId: "root",
      node: { type: "Text", props: { text: "Duplicate" }, children: [] } }, "duplicate_id"],
    [{ op: "add", nodeId: "unapprovedType", parentId: "root",
      node: { type: "NotAdmittedByPi", props: {}, children: [] } }, "schema_invalid"],
  ] as const;
  for (const [conflict, code] of operations) {
    const { context, spec } = login();
    const snapshot = structuredClone(spec);
    const result = applyPiTreePatch(spec, patch(updateNotice("Temporary"), conflict), "stable", context);
    assert.equal(result.ok, false, JSON.stringify(result));
    if (result.ok) continue;
    assert.equal(result.error.code, code);
    assert.equal(result.error.opIndex, 1);
    assert.equal(result.spec, spec);
    assert.deepEqual(spec, snapshot);
    assert.equal(catalog.validate(spec).success, true);
    assert.doesNotMatch(JSON.stringify(result.error), /SENSITIVE_VALUE|Temporary/);
  }
});

test("E08 regression: real Pi edit history keeps untouched layout and state across replay", () => {
  const { spec } = login();
  const original = structuredClone(spec);
  const session = createPiTreeEditSession(spec);
  const preview = session.preview(patch(updateNotice("Novo aviso")));
  assert.equal(preview.ok, true, JSON.stringify(preview));
  assert.deepEqual(session.read().spec, original);
  assert.equal(session.commit().ok, true);
  const committed = session.read().spec as typeof spec;
  assert.equal(catalog.validate(committed).success, true);
  for (const id of Object.keys(original.elements)) {
    if (id !== "notice") assert.deepEqual(committed.elements[id], original.elements[id], id);
  }
  assert.deepEqual(committed.state, original.state);
  assert.equal(session.undo().ok, true);
  assert.deepEqual(session.read().spec, original);
  assert.equal(session.redo().ok, true);
  assert.deepEqual(session.read().spec, committed);
  assert.deepEqual(spec, original);
});
