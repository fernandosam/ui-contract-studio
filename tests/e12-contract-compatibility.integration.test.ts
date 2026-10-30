import test from "node:test";
import assert from "node:assert/strict";
import { createContractSdk } from "../src/sdk";
import manifest from "../pi-catalog/contracts.json";
import lock from "../src/ui-catalog/contracts.lock.json";
import historical from "./fixtures/contract-migrations/legacy-reui-versions.json";

const stable = createContractSdk();
const experimental = createContractSdk({ channel: "experimental" });
const projections = new Map(manifest.components.map(entry => [entry.type, entry]));
const reviewed = new Map(lock.components.map(entry => [entry.name, entry]));

test("E12 contract: public metadata is the reviewed version/fingerprint projection", () => {
  const list = stable.list();
  assert.ok(list.length > 0);
  assert.deepEqual(list.map(entry => entry.type),
    [...list.map(entry => entry.type)].sort((a, b) => a.localeCompare(b)));
  assert.equal(new Set(list.map(entry => entry.type)).size, list.length);

  for (const entry of list) {
    const projected = projections.get(entry.type);
    assert.ok(projected, `missing Pi projection for ${entry.type}`);
    assert.equal(entry.version, projected.version, entry.type);
    assert.equal(entry.fingerprint, projected.fingerprint, entry.type);
    assert.equal(entry.tier, projected.tier, entry.type);
    assert.equal(entry.stability, "stable", entry.type);
    assert.equal(projected.lifecycle, "stable", entry.type);
    assert.match(entry.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, entry.type);
    assert.match(entry.fingerprint, /^[a-f0-9]{64}$/, entry.type);
    const source = reviewed.get(entry.type);
    if (source) {
      assert.equal(source.status, "approved", entry.type);
      assert.equal(source.version, entry.version, entry.type);
      assert.equal(source.semanticFingerprint, entry.fingerprint, entry.type);
    }
    const inspected = stable.inspect(entry.type);
    assert.ok(inspected, entry.type);
    assert.equal(inspected.fingerprint, entry.fingerprint);
    assert.equal(inspected.version, entry.version);
    assert.ok(inspected.propsSchema, entry.type);
  }
});

test("E12 compatibility: stable remains available with explicit experimental opt-in", () => {
  assert.equal(stable.channel, "stable");
  assert.equal(experimental.channel, "experimental");
  for (const contract of stable.list()) {
    const candidate = experimental.inspect(contract.type);
    assert.ok(candidate, `experimental view lost stable contract ${contract.type}`);
    assert.equal(candidate.version, contract.version);
    assert.equal(candidate.fingerprint, contract.fingerprint);
  }
  assert.equal(stable.inspect("NeverAdmittedContract"), null);
  assert.equal(experimental.inspect("NeverAdmittedContract"), null);
});

test("E12 compatibility: historically pinned contracts must be rechecked", () => {
  for (const [type, oldPin] of Object.entries(historical.contracts)) {
    const current = stable.inspect(type);
    assert.ok(current, type);
    assert.notDeepEqual(
      { version: current.version, fingerprint: current.fingerprint },
      { version: oldPin.version, fingerprint: oldPin.fingerprint },
      `historical pin unexpectedly matches current ${type}`,
    );
    assert.equal(current.version, projections.get(type)?.version);
    assert.equal(current.fingerprint, reviewed.get(type)?.semanticFingerprint);
  }
});

test("E12 contract: generated JSON is deterministic, detached and validated by the same SDK", () => {
  const request = {
    root: "root",
    nodes: [{ id: "root", type: "Card" as const, props: { title: "Contract test", description: null } }],
  };
  const first = stable.generate(request);
  const second = stable.generate(request);
  assert.deepEqual(first, second);
  assert.equal(first.valid, true);
  if (!first.valid) return;
  assert.equal(stable.validate(first.spec).valid, true);
  request.nodes[0].props.title = "Client mutation";
  assert.equal((first.spec.elements.root as { props: { title: string } }).props.title, "Contract test");
  assert.notEqual(JSON.stringify(first.spec).includes("Client mutation"), true);
});

test("E12 contract: errors reject unknown, unsafe and secret-bearing inputs without echoing values", () => {
  const secret = "E12-PRIVATE-CREDENTIAL-DO-NOT-PRINT";
  const invalid = stable.validate({
    root: "r", elements: { r: {
      type: "Card", props: { title: "Example", description: null, extra: secret }, children: [],
    } },
  });
  assert.equal(invalid.valid, false);
  assert.doesNotMatch(JSON.stringify(invalid), /E12-PRIVATE-CREDENTIAL-DO-NOT-PRINT/);
  assert.equal(stable.generate({ root: "r", nodes: [
    { id: "r", type: "NeverAdmittedContract", props: {} },
  ] } as never).valid, false);
  const getter = Object.defineProperty({}, "secret", { enumerable: true, get() { throw Error(secret); } });
  assert.equal(stable.validate(getter).valid, false);
  const cycle: Record<string, unknown> = {};
  cycle.self = cycle;
  assert.equal(stable.validate(cycle).valid, false);
  assert.equal(stable.validate(JSON.parse('{"root":"r","elements":{"__proto__":{}}}')).valid, false);
});
