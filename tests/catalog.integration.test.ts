import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { catalog, componentDefinitions, playgroundDefinitions, actionDefinitions } from "../src/ui-catalog/catalog";
import { registry, actionImplementations } from "../src/ui-catalog/registry";

const original = JSON.parse(readFileSync(new URL("../src/ui-screens/blocos-login.json", import.meta.url), "utf8"));

test("blocos-login é aceito pelo catálogo real (Zod)", () => {
  const result = catalog.validate(original);
  assert.equal(result.success, true, result.success ? "" : result.error.message);
});

test("tipo inventado é recusado pelo catálogo real", () => {
  const altered = structuredClone(original);
  altered.elements[altered.root].type = "FakeWidget";
  assert.equal(catalog.validate(altered).success, false);
});

test("propriedade não aprovada é recusada pelo schema estrito", () => {
  const altered = structuredClone(original);
  altered.elements[altered.root].props.unknownStyle = "unsafe";
  assert.equal(catalog.validate(altered).success, false);
});

test("registry implementa os tipos conhecidos", () => {
  for (const name of Object.keys(componentDefinitions)) assert.ok(name in registry, `Sem implementação: ${name}`);
});

for (const screen of ["blocos-login", "blocos-signup", "blocos-sidebar"]) {
  test(`${screen}: schema real e props validados`, () => {
    const spec = JSON.parse(readFileSync(new URL(`../src/ui-screens/${screen}.json`, import.meta.url), "utf8"));
    const result = catalog.validate(spec);
    assert.equal(result.success, true, result.success ? "" : result.error.message);
  });
}

test("41 definições oficiais + extensões aprovadas", () => {
  assert.equal(Object.keys(playgroundDefinitions).length, 41);
  assert.equal(Object.keys(componentDefinitions).length, 102); // 41 base + 61 extensões aprovadas
});
test("implementações de ações correspondem ao catálogo", () => {
  assert.deepEqual(Object.keys(actionImplementations).sort(), Object.keys(actionDefinitions).sort());
});
