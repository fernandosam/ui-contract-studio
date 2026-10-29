import test from "node:test";
import assert from "node:assert/strict";
import { applyPiTreePatch } from "../src/ui-runtime/tree-operations";
import { catalog } from "../src/ui-catalog/catalog";
import { resolvePattern, generatePatternPreview } from "../src/ui-requirements/patterns";
import { resolveAnswers } from "../src/ui-requirements/engine";
import { generateRegistrationScreen } from "../src/ui-requirements/generator";

const patch = (...operations: Record<string, unknown>[]) => ({
  schemaVersion: 1, operations,
});
const update = (nodeId: string, setProps: Record<string, unknown>) => ({
  op: "update", nodeId, setProps,
});

test("E08: valid contextual edits preserve schema, IDs, refs and unaffected state", () => {
  const context = resolvePattern("login");
  const initial = generatePatternPreview(context);
  const snapshot = structuredClone(initial);
  const result = applyPiTreePatch(initial, patch(update("notice", { text: "Novo aviso" })), "stable", context);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(catalog.validate(result.spec).success, true);
  assert.equal((result.spec as typeof initial).elements.notice.props.text, "Novo aviso");
  assert.equal((result.spec as typeof initial).elements.root.props.maxWidth, "md");
  assert.deepEqual(initial, snapshot);
});

test("E08: reject schema-valid layout violations under an explicit semantic context", () => {
  const cases = [
    {
      context: resolvePattern("login"),
      create: () => generatePatternPreview(resolvePattern("login")),
      operation: update("root", { maxWidth: "full" }),
      corrupt: (s: ReturnType<typeof generatePatternPreview>) => { s.elements.root.props.maxWidth = "full"; },
    },
    {
      context: resolvePattern("login"),
      create: () => generatePatternPreview(resolvePattern("login")),
      operation: { op: "move", nodeId: "notice", parentId: "root", index: 0 },
      corrupt: (s: ReturnType<typeof generatePatternPreview>) => {
        s.elements.root.children = ["notice", "fields", "action"];
      },
    },
    {
      context: resolvePattern("dashboard", { view: "kpis", density: "2" }),
      create: () => generatePatternPreview(resolvePattern("dashboard", { view: "kpis", density: "2" })),
      operation: update("stats", { columns: 4 }),
      corrupt: (s: ReturnType<typeof generatePatternPreview>) => { s.elements.stats.props.columns = 4; },
    },
  ];
  for (const scenario of cases) {
    const original = scenario.create(), snapshot = structuredClone(original);
    const invalid = structuredClone(original);
    scenario.corrupt(invalid);
    assert.equal(catalog.validate(invalid).success, true,
      "layout gate must reject an otherwise authorized Zod spec");
    const result = applyPiTreePatch(original, patch(scenario.operation), "stable", scenario.context);
    assert.equal(result.ok, false, JSON.stringify(scenario.operation));
    if (result.ok) continue;
    assert.equal(result.error.code, "layout_invalid");
    assert.equal(result.error.opIndex, 0);
    assert.equal(result.spec, original);
    assert.deepEqual(original, snapshot);
  }
});

test("E08: an invalid later edit rejects earlier valid edits atomically", () => {
  const context = resolvePattern("login");
  const initial = generatePatternPreview(context), snapshot = structuredClone(initial);
  const result = applyPiTreePatch(initial, patch(
    update("notice", { text: "Temporário" }),
    { op: "move", nodeId: "notice", parentId: "root", index: 0 },
  ), "stable", context);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, "layout_invalid");
  assert.equal(result.error.opIndex, 1);
  assert.equal(result.spec, initial);
  assert.deepEqual(initial, snapshot);
});

test("E08: registration hierarchy is enforced without expanding Zod contracts", () => {
  const context = resolveAnswers({ persistence: "local-demo", layout: "single" });
  const original = generateRegistrationScreen(context), baseline = structuredClone(original);
  const result = applyPiTreePatch(original, patch(update("root", { centered: false })), "stable", context);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, "layout_invalid");
  assert.deepEqual(original, baseline);
});

test("E08: without an explicit flow, generic layout invariants still apply", () => {
  const initial = generatePatternPreview(resolvePattern("login"));
  const allowed = applyPiTreePatch(initial, patch(update("root", { maxWidth: "full" })));
  assert.equal(allowed.ok, true, "a screen-specific plan must never be guessed from node names");
  const blocked = applyPiTreePatch(initial, patch(update("notice", { text: "updated" }),
    { op: "move", nodeId: "fields", parentId: "notice" }));
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.error.code, "layout_invalid");
});

test("E08: Zod and authorized contracts run before contextual layout rules", () => {
  const context = resolvePattern("login"), original = generatePatternPreview(context);
  const blocked = applyPiTreePatch(original, patch({
    op: "add", nodeId: "evil", parentId: "root",
    node: { type: "UnknownPiContract", props: {}, children: [] },
  }), "stable", context);
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.error.code, "schema_invalid");
});
