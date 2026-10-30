import test from "node:test";
import assert from "node:assert/strict";
import { createContractSdk, type ValidationResult } from "../src/sdk";
import { createProtectedContractGateway } from "../src/sdk/server.mjs";

const readonlyToken = "readonly-user-token-32-characters-OK";
const authorToken = "author-token-32-characters-long-OK";
const experimentalToken = "experimental-token-32-characters-OK";
const stable = createContractSdk();
const experimental = createContractSdk({ channel: "experimental" });
const identities = new Map([
  [readonlyToken, { subject: "reader", tenantId: "tenant-1", scopes: new Set(["contracts:read"]) }],
  [authorToken, { subject: "author", tenantId: "tenant-1",
    scopes: new Set(["contracts:read", "contracts:validate", "contracts:generate"]) }],
  [experimentalToken, { subject: "reviewer", tenantId: "tenant-1",
    scopes: new Set(["contracts:read", "contracts:experimental"]) }],
]);
const gateway = createProtectedContractGateway({
  stableSdk: stable,
  experimentalSdk: experimental,
  authenticate: async token => identities.get(token) ?? null,
  clock: () => 1_000,
});
const host = (bearerToken: string) => ({ peerId: "verified-peer-from-server", bearerToken });
const card = { root: "page", nodes: [
  { id: "page", type: "Card" as const, props: { title: "E12 journey", description: null } },
] };

test("E12 end-to-end: authenticated host -> gateway -> real SDK -> JSON -> validation", async () => {
  const listed = await gateway.execute(host(authorToken), { operation: "list" });
  assert.equal(listed.status, 200);
  if (!listed.ok) return;
  const entries = listed.value as ReturnType<typeof stable.list>;
  assert.ok(entries.some(entry => entry.type === "Card"));

  const inspected = await gateway.execute(host(authorToken), { operation: "inspect", input: "Card" });
  assert.equal(inspected.status, 200);
  if (!inspected.ok) return;
  const detail = inspected.value as ReturnType<typeof stable.inspect>;
  assert.ok(detail);
  assert.equal(detail.version, stable.inspect("Card")?.version);
  assert.equal(detail.fingerprint, stable.inspect("Card")?.fingerprint);

  const generated = await gateway.execute(host(authorToken), { operation: "generate", input: card });
  assert.equal(generated.status, 200);
  if (!generated.ok) return;
  const result = generated.value as ValidationResult;
  assert.equal(result.valid, true);
  if (!result.valid) return;
  assert.equal(result.spec.root, "page");

  const validated = await gateway.execute(host(authorToken), { operation: "validate", input: result.spec });
  assert.equal(validated.status, 200);
  if (!validated.ok) return;
  const checked = validated.value as ValidationResult;
  assert.equal(checked.valid, true);
  if (checked.valid) assert.deepEqual(checked.spec, result.spec);
});

test("E12 end-to-end: credential, operation scope and experimental opt-in are separate checks", async () => {
  assert.equal((await gateway.execute(host("invalid"), { operation: "list" })).status, 401);
  assert.equal((await gateway.execute(host(readonlyToken), { operation: "list" })).status, 200);
  assert.equal((await gateway.execute(host(readonlyToken), { operation: "generate", input: card })).status, 403);
  assert.equal((await gateway.execute(host(readonlyToken), {
    operation: "list", channel: "experimental",
  })).status, 403);
  assert.equal((await gateway.execute(host(experimentalToken), {
    operation: "list", channel: "experimental",
  })).status, 200);
  assert.equal((await gateway.execute(host(experimentalToken), {
    operation: "validate", channel: "experimental", input: {},
  })).status, 403);
});

test("E12 end-to-end: invalid contract inputs do not become successful specifications", async () => {
  const secret = "E12-DO-NOT-ECHO-THIS-SECRET";
  const invalid = await gateway.execute(host(authorToken), {
    operation: "generate",
    input: { root: "page", nodes: [
      { id: "page", type: "Card", props: { title: "Test", description: null, secret } },
    ] },
  });
  assert.equal(invalid.status, 200, "validation failures are typed SDK results, not transport failures");
  if (!invalid.ok) return;
  const result = invalid.value as ValidationResult;
  assert.equal(result.valid, false);
  assert.doesNotMatch(JSON.stringify(result), /E12-DO-NOT-ECHO-THIS-SECRET/);

  const denied = await gateway.execute(host(authorToken), {
    operation: "validate", input: { root: "r", elements: {
      r: { type: "NotReviewed", props: {}, children: [] },
    } },
  });
  assert.equal(denied.status, 200);
  if (denied.ok) assert.equal((denied.value as ValidationResult).valid, false);
});
