import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { canReadDataSource } from "../src/ui-data/source-policy.mjs";
import { graphErrors } from "../scripts/lib/spec-invariants.mjs";

const code = path => readFileSync(path, "utf8");
const spec = () => ({
  root: "root", elements: {
    root: { type: "Button", props: { label: "Testar" }, children: [] }
  }
});
const events = { Button: { events: ["press"] } };
const actions = ["setState", "pushState", "removeState", "buttonClick", "formSubmit", "linkClick"];

test("JSON cannot enable external data access; host must opt in explicitly", () => {
  assert.equal(canReadDataSource("demo-processos"), true);
  assert.equal(canReadDataSource("processos-api"), false);
  assert.equal(canReadDataSource("processos-api", {}), false);
  assert.equal(canReadDataSource("processos-api", { remoteData: "true" }), false);
  assert.equal(canReadDataSource("https://example.com", { remoteData: true }), false);
  assert.equal(canReadDataSource("processos-api", { remoteData: true }), true);
  const provider = code("src/ui-data/providers.ts");
  assert.match(provider, /canReadDataSource\(sourceId, capabilities\)/);
  assert.match(provider, /redirect:'error'/);
  const screen = code("src/ui-runtime/spec-screen.tsx");
  assert.match(screen, /remoteDataEnabled=false/);
  assert.match(screen, /DataAccessContext\.Provider/);
  assert.match(code("src/ui-catalog/extensions/components/data-table.tsx"), /useContext\(DataAccessContext\)/);
});

test("JSON actions cannot call remote services or manipulate prototype paths", () => {
  const valid = spec();
  valid.elements.root.on = { press: { action: "buttonClick", params: { message: "ok" } } };
  assert.deepEqual(graphErrors(valid, ["Button"], { allowedActions: actions, allowedEvents: events }), []);
  for (const action of ["fetch", "openUrl", "submitRemote", "execute", "import"]) {
    const attack = structuredClone(valid);
    attack.elements.root.on.press.action = action;
    assert.match(graphErrors(attack, ["Button"], { allowedActions: actions, allowedEvents: events }).join(" "), /não permitida/);
  }
  for (const path of ["__proto__.admin", "user.constructor.prototype", "items[__proto__]", "safe\nunsafe"]) {
    const attack = structuredClone(valid);
    attack.elements.root.on.press = { action: "setState", params: { statePath: path, value: true } };
    assert.match(graphErrors(attack, ["Button"], { allowedActions: actions, allowedEvents: events }).join(" "), /statePath não autorizado/);
  }
});

test("renderer has a one-way action boundary; external services have no action handlers", () => {
  const registry = code("src/ui-catalog/registry.tsx");
  assert.match(registry, /parseLocalFeedbackAction/);
  assert.doesNotMatch(registry, /\bfetch\s*\(/);
  assert.doesNotMatch(registry, /createSubmissionGateway|\/__demo__\/submit|window\.open/);
  const screen = code("src/ui-runtime/spec-screen.tsx");
  assert.match(screen, /catalog\.validate\(spec\)/);
  assert.match(screen, /graphErrors\(spec/);
  assert.doesNotMatch(screen, /\bfetch\s*\(/);
  assert.doesNotMatch(screen, /createSubmissionGateway/);
  assert.match(code("scripts/check-boundaries.ts"), /Network API forbidden/);
});

test("generation artifacts are JSON, and default application does not grant remote capability", () => {
  const screenFiles = readdirSync("src/ui-screens");
  assert.ok(screenFiles.length > 0);
  assert.ok(screenFiles.every(name => name.endsWith(".json")));
  assert.doesNotMatch(code("src/ui-runtime/app.tsx"), /remoteDataEnabled=\{true\}/);
  assert.match(code("scripts/check-screen-discovery.mjs"), /ui-screens/);
});
