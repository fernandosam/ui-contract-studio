import test from "node:test";
import assert from "node:assert/strict";
import { createPiTreeEditSession } from "../src/ui-runtime/tree-edit-session";
import { catalog } from "../src/ui-catalog/catalog";

const make = () => ({
  root: "root",
  state: { filter: "pending" },
  elements: {
    root: { type: "Card", props: { title: "Preview", description: null }, children: ["first"] },
    first: { type: "Text", props: { text: "Initial" }, children: [] },
  },
});
const patch = (text: string) => ({
  schemaVersion: 1,
  operations: [{ op: "update", nodeId: "first", setProps: { text } }],
});

test("E08: the session uses the official stable Zod and graph validation for preview and replay", () => {
  const original = make(), editor = createPiTreeEditSession(original);
  const preview = editor.preview(patch("Edited"));
  assert.equal(preview.ok, true, JSON.stringify(preview));
  assert.equal(editor.read().spec && catalog.validate(editor.read().spec).success, true);
  assert.equal(editor.read().spec && (editor.read().spec as typeof original).elements.first.props.text, "Initial");
  assert.equal(editor.commit().ok, true);
  assert.equal(catalog.validate(editor.read().spec).success, true);
  assert.equal((editor.read().spec as typeof original).elements.first.props.text, "Edited");
  assert.equal(editor.undo().ok, true);
  assert.equal(editor.redo().ok, true);
  assert.equal((editor.read().spec as typeof original).elements.first.props.text, "Edited");
  assert.deepEqual((editor.read().spec as typeof original).state, original.state);
  assert.equal(original.elements.first.props.text, "Initial");
});

test("E08: forbidden props, handlers and nonadmitted types never enter preview or history", () => {
  const editor = createPiTreeEditSession(make());
  const invalid = [
    { op: "update", nodeId: "first", setProps: { forbidden: "value" } },
    { op: "add", nodeId: "bad", parentId: "root",
      node: { type: "NonAdmitted", props: {}, children: [] } },
    { op: "add", nodeId: "handler", parentId: "root",
      node: { type: "Text", props: { text: "hi" }, children: [], on: { click: [] } } },
  ];
  for (const operation of invalid) {
    const result = editor.preview({ schemaVersion: 1, operations: [operation] });
    assert.equal(result.ok, false, JSON.stringify(operation));
    assert.equal(editor.read().history.length, 0);
    assert.equal(editor.commit().ok, false);
    assert.deepEqual(editor.read().spec, make());
  }
});
