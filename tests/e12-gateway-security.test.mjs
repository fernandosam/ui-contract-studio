import test from "node:test";
import assert from "node:assert/strict";
import { createProtectedContractGateway } from "../src/sdk/server.mjs";

const token = "trusted-credential-not-a-real-key-32";
const transport = (peerId = "trusted-proxy-peer") => ({ peerId, bearerToken: token });
const identity = (subject = "user", tenantId = "tenant", scopes = ["contracts:read"]) =>
  ({ subject, tenantId, scopes: new Set(scopes) });
const sdk = (overrides = {}) => ({
  channel: "stable",
  list: () => [{ type: "Card" }],
  inspect: type => ({ type }),
  validate: input => ({ valid: true, spec: input }),
  generate: input => ({ valid: true, spec: input }),
  ...overrides,
});
const create = (options = {}) => createProtectedContractGateway({
  stableSdk: sdk(),
  authenticate: async bearer => bearer === token ? identity() : null,
  clock: () => 1_000,
  ...options,
});

test("E12 security: unverified, malformed or wildcard identities never authorize", async () => {
  for (const authenticate of [
    async () => null,
    async () => ({ subject: "user", tenantId: "tenant", scopes: ["contracts:read"] }),
    async () => ({ subject: "user", tenantId: "tenant", scopes: new Set(["contracts:*"]) }),
    async () => ({ subject: "user", tenantId: "", scopes: new Set(["contracts:read"]) }),
  ]) {
    const result = await create({ authenticate }).execute(transport(), { operation: "list" });
    assert.equal(result.ok, false);
    assert.ok([401, 403].includes(result.status));
    assert.doesNotMatch(JSON.stringify(result), /trusted-credential|tenant|user/);
  }
});

test("E12 security: command metadata cannot impersonate a tenant or override scopes", async () => {
  let invoked = 0;
  const g = create({
    stableSdk: sdk({ list: () => { invoked++; return []; } }),
    authenticate: async () => identity("readonly-user", "trusted-tenant"),
  });
  assert.equal((await g.execute(transport(), { operation: "list", tenantId: "other-tenant" })).status, 400);
  assert.equal((await g.execute(transport(), { operation: "list", scopes: ["contracts:generate"] })).status, 400);
  assert.equal((await g.execute(transport(), { operation: "generate", input: {} })).status, 403);
  assert.equal((await g.execute(transport(), { operation: "list" })).status, 200);
  assert.equal(invoked, 1);
});

test("E12 security: accessors, prototype pollution and oversized Unicode input fail closed", async () => {
  let getterCalls = 0;
  const malicious = Object.defineProperty({}, "credential", {
    enumerable: true, get() { getterCalls++; throw Error("PRIVATE"); },
  });
  const g = create({
    authenticate: async () => identity("u", "t", ["contracts:validate"]),
    limits: { maxRequestBytes: 120 },
  });
  const cases = [
    [{ operation: "validate", input: malicious }, 400],
    [{ operation: "validate", input: JSON.parse('{"__proto__":{"admin":true}}') }, 400],
    [{ operation: "validate", input: { value: "é".repeat(100) } }, 413],
    [{ operation: "validate", input: { value: Number.POSITIVE_INFINITY } }, 400],
  ];
  for (const [command, status] of cases) {
    const response = await g.execute(transport(), command);
    assert.equal(response.status, status);
    assert.doesNotMatch(JSON.stringify(response), /PRIVATE|credential|admin/);
  }
  assert.equal(getterCalls, 0);
  assert.equal({}.admin, undefined);
});

test("E12 security: a global pre-auth budget cannot be evaded by rotating peers", async () => {
  const g = create({ limits: { globalAuthAttemptsPerMinute: 2, authAttemptsPerMinute: 2 } });
  assert.equal((await g.execute(transport("a"), { operation: "list" })).status, 200);
  assert.equal((await g.execute(transport("b"), { operation: "list" })).status, 200);
  const blocked = await g.execute(transport("c"), { operation: "list" });
  assert.equal(blocked.status, 429);
  assert.equal(blocked.error, "rate_limited");
});

test("E12 security: backwards clock movement never resets the quota window", async () => {
  let now = 1_000;
  const g = create({ clock: () => now, limits: { requestsPerMinute: 1 } });
  assert.equal((await g.execute(transport(), { operation: "list" })).status, 200);
  now = 0;
  assert.equal((await g.execute(transport(), { operation: "list" })).status, 429);
  now = 60_001;
  assert.equal((await g.execute(transport(), { operation: "list" })).status, 200);
});

test("E12 security: concurrent subjects in one tenant share a reserved capacity", async () => {
  let release, signal;
  const started = new Promise(resolve => { signal = resolve; });
  const held = new Promise(resolve => { release = resolve; });
  let subject = "alice", calls = 0;
  const g = create({
    stableSdk: sdk({ list: () => {
      calls++;
      if (calls === 1) { signal(); return held; }
      return [];
    } }),
    authenticate: async () => identity(subject, "shared-tenant"),
    limits: { concurrentPerTenant: 1, concurrentPerPrincipal: 1, concurrentGlobal: 2 },
  });
  const first = g.execute(transport(), { operation: "list" });
  await started;
  subject = "bob";
  const other = await g.execute(transport("other"), { operation: "list" });
  assert.equal(other.status, 429);
  assert.equal(other.error, "busy");
  assert.equal(calls, 1);
  release([]);
  assert.equal((await first).status, 200);
  assert.equal((await g.execute(transport("other"), { operation: "list" })).status, 200);
});

test("E12 security: thrown private SDK errors return only a sanitized unavailable response", async () => {
  const g = create({ stableSdk: sdk({
    validate: () => { throw Error("PRIVATE_BACKEND_TOKEN=never-leak"); },
  }), authenticate: async () => identity("u", "t", ["contracts:validate"]) });
  const failure = await g.execute(transport(), { operation: "validate", input: {} });
  assert.deepEqual(failure, { ok: false, status: 503, error: "unavailable" });
});
