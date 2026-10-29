import test from "node:test";
import assert from "node:assert/strict";
import { applyPiTreePatch } from "../src/ui-runtime/tree-operations";
import { catalog } from "../src/ui-catalog/catalog";

const make = () => ({
  root: "root", elements: {
    root: { type: "Card", props: { title: "Interface", description: null }, children: ["first"] },
    first: { type: "Text", props: { text: "Original" }, children: [] },
  },
});

test("E08: patch JSON completo permanece válido no catálogo Zod oficial", () => {
  const initial = make();
  const result = applyPiTreePatch(initial, { schemaVersion: 1, operations: [
    { op: "add", nodeId: "second", parentId: "root", index: 1,
      node: { type: "Text", props: { text: "Novo" }, children: [] } },
    { op: "move", nodeId: "second", parentId: "root", index: 0 },
    { op: "update", nodeId: "first", setProps: { text: "Atualizado" } },
    { op: "remove", nodeId: "second" },
  ] });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(result.spec, { root: "root", elements: {
    root: { type: "Card", props: { title: "Interface", description: null }, children: ["first"] },
    first: { type: "Text", props: { text: "Atualizado" }, children: [] },
  } });
  assert.equal(catalog.validate(result.spec).success, true);
  assert.equal(initial.elements.first.props.text, "Original");
});

test("E08: tipos, props, novos handlers e referências não autorizados são rejeitados sem efeitos", () => {
  const scenarios = [
    { op: "add", nodeId: "unapproved", parentId: "root", node: { type: "Invented", props: {}, children: [] } },
    { op: "update", nodeId: "first", setProps: { arbitraryHtml: "<script>bad()</script>" } },
    { op: "add", nodeId: "withAction", parentId: "root", node: { type: "Text", props: { text: "Test" }, children: [], on: { click: [{ action: "buttonClick" }] } } },
    { op: "add", nodeId: "withChildren", parentId: "root", node: { type: "Text", props: { text: "Test" }, children: ["first"] } },
  ];
  for (const operation of scenarios) {
    const original = make(), snapshot = structuredClone(original);
    const result = applyPiTreePatch(original, { schemaVersion: 1, operations: [operation] });
    assert.equal(result.ok, false, JSON.stringify(operation));
    assert.deepEqual(result.spec, snapshot);
    assert.deepEqual(original, snapshot);
  }
});

test("E08: o canal estável rejeita qualquer tipo não admitido", () => {
  const original = make();
  const result = applyPiTreePatch(original, { schemaVersion: 1, operations: [{
    op: "add", nodeId: "unregistered", parentId: "root",
    node: { type: "NotAdmittedByPi", props: {}, children: [] },
  }] });
  if (result.ok) throw new Error("O canal estável não deveria aceitar o nó.");
  assert.equal(result.error.code, "schema_invalid");
  assert.deepEqual(result.spec, original);
});
