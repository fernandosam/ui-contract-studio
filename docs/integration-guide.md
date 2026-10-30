[English](integration-guide.md) | [Português](integration-guide.pt-BR.md)

# E12 — Integrating with UI Contract Studio

This is the **consumer-facing integration guide** for the current source-level SDK and local CLI. It describes existing behavior; the portable error envelope below is an **example adapter**, not a newly published server API. See [SDK reference](typed-contract-sdk.md), [file/CLI decision](external-integrations.md), [contract versioning](contract-versioning.md), and [security](../SECURITY.md).

## Choose the smallest available integration

| Consumer | Supported entry point | Boundary |
| --- | --- | --- |
| Tools/CI in a checked-out, pinned revision | `pi-catalog/contracts.json` + `pi-catalog/examples/` + `npm run pi:validate` | Read-only files and a local process; no remote service |
| Trusted TypeScript code using this repository's source | `createContractSdk` from `src/sdk/index.ts` | In-process generation, list, inspect and validation; not a published npm package |
| Untrusted callers of an application server | A **host-owned** authentication/authorization boundary | The opt-in Node gateway is proposed in [PR #197](https://github.com/fernandosam/ui-contract-studio/pull/197); **not available on main as of this guide** |
| Browser rendering | Application-controlled runtime | The SDK does not expose a standalone renderer or authorize network operations |

Use **stable** by default. Experimental is opt-in for reviewed internal development and does not automatically become a production entitlement. No E12 HTTP endpoint, external SDK package, webhook, MCP tool or remote Pi execution is provided.

## 1. Source-level SDK quickstart

From a checkout of a **reviewed Git commit** (Node.js 22+, `npm ci`), run the existing regression example:

~~~sh
npx tsx --test tests/integration-guide.integration.test.ts
~~~

[Executable integration example](../examples/integrations/contract-sdk.ts) exports `generatePinnedCard(pin)` and `normalizeValidation(result)`. The sample requires a **previously recorded** `type`, `version` and `fingerprint` and refuses to generate when any differs from `sdk.inspect("Card")`.

Minimal SDK invocation (inside this repository):

~~~ts
import { createContractSdk } from "../src/sdk";

const sdk = createContractSdk(); // stable, local, no network
const details = sdk.inspect("Card"); // null if unavailable/unverified
if (!details) throw new Error("Contract unavailable");
const result = sdk.generate({
  root: "intro",
  nodes: [{ id: "intro", type: "Card", props: { title: "Welcome", description: null } }],
});
if (!result.valid) {
  // Return bounded codes/pointers to the submitter, not values or messages in logs.
  throw new Error("Spec rejected: " + result.issues.map(issue => issue.code).join(", "));
}
// result.spec is a detached, Zod- and graph-validated JSON specification.
~~~

`list()` discovers eligible contracts; `inspect(type)` returns version, fingerprint, maturity, events/slots and projected props JSON Schema. `validate(unknown)` verifies an existing spec. `generate({ root, nodes, state? })` builds and validates a spec; it **does not generate with AI** or admit new types. See [SDK reference](typed-contract-sdk.md) for return types. Do **not** expose the unprotected SDK directly to untrusted network clients.

## 2. File/CLI consumer (no SDK import required)

Pin the repository to an immutable, reviewed commit SHA, then from that checkout:

~~~sh
npm ci
npm run pi:api:check
npm run pi:validate -- --file=pi-catalog/examples/Card.json
~~~

The validator reads a **local** JSON file; it does not fetch files or expose HTTP. Production inputs must come from a controlled location inside the checkout (no traversal). A custom output file is restricted to `reports/pi-validation/*.json` via `--out=reports/pi-validation/result.json`.

The CLI emits JSON with `valid`, `source`, `channel`, `validator`, bounded `issues` and `truncated` for ordinary validation results. Exit code `0` means valid, `1` rejected, and `2` indicates invalid CLI arguments; inability to start the process, missing output or malformed output must also **block** the pipeline. Argument and filesystem errors are **not guaranteed** to produce the usual JSON envelope. Never use stdout text as the security boundary: check the exit status **and** the parsed `valid === true` result.

The manifest uses `schemaVersion: 3` and one `components` array; entries may be experimental. Reading a manifest or example never grants actions, props, network access or authorization. Check the reviewed lock and run the real Zod validator for accepted specs.

## 3. Version pinning and upgrades

Keep **three distinct identities**:

| Identity | Meaning | Consumer rule |
| --- | --- | --- |
| Git commit SHA | Exact source/validator/manifest revision | Pin immutable SHA for every release; match validator and renderer revisions |
| `schemaVersion` / `projectVersion` | Manifest format / project snapshot | Require supported schema (currently `3`); project version is **not** per-contract SemVer |
| Per-contract `type` + `version` + `fingerprint` | Reviewed component contract | Store the expected triple alongside the consumer release; compare it with `inspect` or the reviewed manifest before use |

Per-contract versions follow [E07 SemVer](contract-versioning.md): compatible additions require reviewed changes; removals or unproven behavior changes may be major. A fingerprint change is **never** an automatic migration authorization, and an unchanged fingerprint is not proof of end-to-end compatibility. On upgrade, compare the used types, inspect the [impact procedure](contract-versioning.md), rerun `pi:api:check`, `pi:validate`/SDK validation, affected tests and UI checks, and deploy only after review. Unsupported versions or absent metadata **fail closed**. Explicit historical migrations, where reviewed, use [`contracts:migrate`](contract-versioning.md), not runtime guessing.

## 4. Standardized failure handling at the consumer boundary

The **underlying SDK contract is unchanged**: `validate`/`generate` return a discriminated `valid` result; `inspect` returns `null` for unavailable types. Error `issues[].code` can be a Zod code or a structural/SDK code; **do not treat this dynamic set as a new versioned enum**. The [example adapter](../examples/integrations/contract-sdk.ts) maps it into this optional, host-owned, sanitized shape:

~~~json
{
  "ok": false,
  "error": {
    "code": "SPEC_INVALID",
    "message": "Specification rejected by the reviewed contract validator.",
    "retryable": false,
    "issues": [{ "code": "unrecognized_keys", "pointer": "/elements/intro/props" }]
  }
}
~~~

The sample's stable **integration categories** are `CONTRACT_UNAVAILABLE`, `CONTRACT_VERSION_MISMATCH` and `SPEC_INVALID`. They are **not** SDK return codes. On success the sample returns `{ ok: true, spec, contract }`. `issues` are limited to 20 codes/pointers, without raw inputs or Zod message text. A JSON pointer may still contain user-chosen node identifiers: return it only to the authorized submitter, **do not log it verbatim**.

| Failure source | Detection | Treatment / retry |
| --- | --- | --- |
| SDK bad JSON, disallowed type/prop/action, graph/ID errors | `valid: false` with bounded `issues` (`invalid_json_input`, `graph_invariant`, `contract_not_authorized`, etc.) | `SPEC_INVALID`; correct input; **no automatic retry** |
| Unavailable contract, changed version/fingerprint | `inspect(...) === null` or pin mismatch | `CONTRACT_UNAVAILABLE` / `CONTRACT_VERSION_MISMATCH`; review/re-pin, never silent downgrade or experimental fallback |
| Invalid SDK initialization, stale manifest or unexpected exception | Throw or process failure | Fail closed and alert operators; do not return stack traces or raw values |
| CLI validation error / missing or unusable CLI output | Nonzero exit, `valid !== true`, missing/invalid JSON | Reject build/release; inspect sanitized diagnostics, no blind retry |
| Authn/authz, input size, quotas (host / **pending PR #197**) | Gateway `{ ok: false, status, error, retryAfterSeconds? }` | See mapping below; no claim of deployed HTTP routes |

**Gateway vocabulary in PR #197 only:** `401 unauthorized` (verify credentials; do not spin retries), `403 forbidden` (request correct scope), `400 invalid_request` and `413 payload_too_large` (correct input), `429 rate_limited`/`quota_exceeded`/`busy` (bounded, jittered retry **only** after `retryAfterSeconds` when supplied and only for idempotent operations), and `503 unavailable` (fail closed, operator investigation; never assume retry safety). A valid gateway transport result `{ ok: true, status: 200, value: { valid: false, issues } }` is a **validation rejection**, not an HTTP authorization error. Status numbers are returned by the Node gateway; any HTTP mapping is implemented and tested by the **host**, not this repository.

## 5. Production and verification boundaries

External authentication is always host-owned: verify token issuer/audience/signature/expiry/revocation, derive peer/tenant/identity from trusted sources, enforce required scopes, TLS/CSRF and per-replica/distributed quotas as needed. The pending gateway's counters are **per process only**. Do not log bearer tokens, personal identifiers, submitted specs, rejected values, pointer paths, or secrets. Keep Pi permissions and contract admission separate from documentation and SDK use.

After changes, run:

~~~sh
npm run docs:check
npx tsx --test tests/integration-guide.integration.test.ts
npm run semantic:check
npm run semantic:report
npm run validate
npm run build
~~~

These commands require installed dependencies, and only the checks actually run can be claimed as verification. Full browser E2E remains the existing **manual main-branch stage**; it is not replaced by this guide or by examples.
