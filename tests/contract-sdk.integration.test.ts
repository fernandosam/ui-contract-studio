import test from "node:test";
import assert from "node:assert/strict";
import { createContractSdk } from "../src/sdk";

const sdk = createContractSdk();
const card = () => ({
  id: "page", type: "Card" as const,
  props: { title: "Example", description: null },
});

test("stable SDK lists only reviewed and authorized contracts", () => {
  const entries = sdk.list();
  assert.ok(entries.some(entry => entry.type === "Card"));
  assert.equal(new Set(entries.map(entry => entry.type)).size, entries.length);
  assert.equal(sdk.inspect("AbsentContract"), null);
  const inspected = sdk.inspect("Card");
  assert.equal(inspected?.stability, "stable");
  assert.match(inspected?.fingerprint ?? "", /^[a-f0-9]{64}$/);
  assert.ok(inspected?.propsSchema);
});

test("generation creates a validated, detached spec with children on every node", () => {
  const node = card();
  const result = sdk.generate({ root: "page", nodes: [node] });
  assert.equal(result.valid, true);
  if (!result.valid) return;
  assert.deepEqual(result.spec.elements, {
    page: { type: "Card", props: { title: "Example", description: null }, children: [] },
  });
  node.props.title = "Changed after generation";
  assert.equal((result.spec.elements.page as {props: {title: string}}).props.title, "Example");
  assert.equal(sdk.validate(result.spec).valid, true);
});

test("reject duplicate ids, unknown contracts, bad props and incomplete graph", () => {
  assert.equal(sdk.generate({ root: "page", nodes: [card(), card()] }).valid, false);
  assert.equal(sdk.validate({
    root: "x", elements: { x: { type: "MadeUp", props: {}, children: [] } },
  }).valid, false);
  assert.equal(sdk.validate({
    root: "x", elements: { x: { type: "Card", props: { title: "x", description: null, className: "unsafe" }, children: [] } },
  }).valid, false);
  assert.equal(sdk.validate({
    root: "x", elements: { x: { type: "Card", props: { title: "x", description: null }, children: ["missing"] } },
  }).valid, false);
});

test("reject unauthorized actions, malicious paths and unsafe JSON objects", () => {
  assert.equal(sdk.validate({
    root: "x", elements: { x: { type: "Card", props: { title: "x", description: null }, children: [],
      on: { click: [{ action: "networkCall", params: { url: "https://example.test" } }] } } },
  }).valid, false);
  assert.equal(sdk.validate({
    root: "x", elements: { x: { type: "Button", props: { label: "Run" }, children: [],
      on: { click: [{ action: "setState", params: { statePath: "__proto__.x", value: 1 } }] } } },
  }).valid, false);
  assert.equal(sdk.validate(JSON.parse('{"root":"x","elements":{"__proto__":{}}}')).valid, false);
  const cycle: Record<string, unknown> = {};
  cycle.self = cycle;
  assert.equal(sdk.validate(cycle).valid, false);
});

test("experimental channel is explicit and never grants new actions", () => {
  const experimental = createContractSdk({ channel: "experimental" });
  assert.equal(sdk.channel, "stable");
  assert.equal(experimental.channel, "experimental");
  assert.ok(experimental.inspect("Card"));
  assert.equal(experimental.inspect("MadeUp"), null);
  assert.equal(experimental.validate({ root: "x", elements: { x: {
    type: "Card", props: { title: "x", description: null }, children: [],
    on: { click: [{ action: "remoteSubmit", params: {} }] },
  } } }).valid, false);
  assert.throws(() => createContractSdk({ channel: "invalid" as "stable" }), TypeError);
});

test("validation errors never echo rejected field contents", () => {
  const secret = "PRIVATE-REJECTED-VALUE";
  const result = sdk.validate({
    root: "x", elements: { x: { type: "Card", props: {
      title: "x", description: null, arbitrary: secret,
    }, children: [] } },
  });
  assert.equal(result.valid, false);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE-REJECTED-VALUE/);
});
