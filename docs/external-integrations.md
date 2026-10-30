[English](external-integrations.md) | [Português](external-integrations.pt-BR.md)

# E12 — External use cases and the minimum public integration surface

**Historical E12 discovery decision (before PR #193):** reuse the **read-only, file-based catalog and local validation CLI**, without adding a service or public package. The subsequent [in-process typed SDK](typed-contract-sdk.md) is now available in source form. For **current** workflows, pinning, examples and errors, use the [integration guide](integration-guide.md). No HTTP endpoint, npm SDK package, remote Pi workflow or generic host service is implied by this earlier decision.

## Evidence and assumptions

Confirmed in the repository:

- `pi-catalog/contracts.json` is a generated Pi manifest with `schemaVersion: 3` and a **single `components` array**. Each entry has `type`, `version`, `lifecycle`, `stability`, and `fingerprint`. The array includes experimental entries; being listed does **not** mean permitted by default.
- `pi-catalog/examples/` contains JSON examples, while `pi-catalog/props-json-schema.json` is a generated representation of properties. The authoritative schemas remain Zod in `src/ui-catalog/`.
- `npm run pi:validate -- --file=<file.json>` validates with the real Zod catalog and graph invariants; stable is the default, `--channel=experimental` is explicit. `npm run pi:api:check` detects stale projections.
- `SpecScreen` checks untrusted JSON before rendering. It is a source-level React component, **not** a distributed/public embeddable SDK. External network access through `processos-api` requires a trusted host capability and an application backend that the repository does not provide.
- `package.json` is `private: true`; no external package distribution or supported public HTTP endpoint is declared.

The following are **potential consumers**, not validated demand or commitments: third-party UI generators, repository CI pipelines, application hosts, and external catalog browsers. No external integration traffic, authentication requirements, production SLO, or partner adoption has been demonstrated in this phase.

## External use-case matrix

| Priority | Consumer and intended outcome | Smallest existing interface | Boundary / decision |
| --- | --- | --- | --- |
| P0 | An agent in a separate repository selects allowed UI types and generates a JSON screen | Revision-pinned `pi-catalog/contracts.json`, selected examples and local `pi:validate` | Stable channel only; examples are illustrative and never authorize capabilities |
| P0 | A CI pipeline accepts/rejects a submitted JSON spec before release | Local CLI exit code and JSON diagnostics from `pi:validate` | Validate against the same pinned revision as the renderer; invalid/unavailable validation blocks promotion |
| P1 | An external tool browses component names, version, maturity and documented properties | Read-only manifest; optional generated property schema for discovery | Read only; no inferred action/API permissions from guidance |
| P1 | An application team previews JSON UI in its own React host | Source integration may be evaluated separately | **No supported published renderer embedding contract**, styles/registry package or runtime binary; the source-level contract SDK is not a renderer |
| Deferred | A backend supplies live table data | Existing narrow same-origin `processos-api` adapter, host-controlled | No general-purpose remote data API; server authn/authz, filtering and audit belong to the host |
| Deferred | Remote generation, admission, publishing, webhooks or write operations | None | Not justified by demonstrated use cases; require a separately reviewed design |

Priorities express suggested sequence, **not** measurements of actual external demand.

## Public surface v0: three artifacts/operations, zero new services

1. **Discovery (read-only):** `pi-catalog/contracts.json` from a **specific Git commit SHA**. Require manifest `schemaVersion === 3`; read `components`; select only entries with both `lifecycle === "stable"` and `stability === "stable"`. Keep `type`, `version`, and `fingerprint` alongside each consumer's generated spec or release metadata. Reject missing/duplicate types, unknown shape, unexpected lifecycle, or a mismatched revision. A public repository is not itself an authorization grant.
2. **Authoring reference (read-only):** `pi-catalog/examples/<Type>.json` for selected types only. `pi-catalog/props-json-schema.json` may assist inspection after `npm run pi:zod-schema`, but example/schema projections are **not independent authorities** to permit undocumented props, actions, events, JSX, URLs or network access.
3. **Validation (local, fail closed):** use the checked-out revision's `npm run pi:validate -- --file=reports/generated/screen.json` (or a local path under the checkout without `..`). Treat nonzero exit or inability to run the validator as a rejection, not an implicit success. JSON diagnostics contain `valid`, `channel` and bounded `issues`. For supported consumers use stable/default only; experimental is a consciously separate development lane, not a public integration promise.

**Minimal consumer walkthrough** (illustrative, requires Node.js 22+, `npm ci`, a real generated JSON file, and a checkout pinned to a reviewed SHA):

```bash
npm ci
npm run pi:api:check
npm run pi:validate -- --file=reports/generated/screen.json
```

A CI integrator must ensure the spec is present at the selected path; `npm run pi:validate` does **not** fetch specs, serve requests, or provide a remote validator. Run `npm run contracts:check` and `npm run semantic:check` when reviewing contract/knowledge changes. The optional `npm run semantic:report` writes diagnostic material locally; it is not part of the public surface. **Do not use the experimental channel in default external production flows.**

## Contract ownership, compatibility and trust

- **Authority:** Zod definitions, reviewed lock (`src/ui-catalog/contracts.lock.json`), and the reviewed admission policy own permissions and maturity. The generated Pi manifest is a projection, not a second approval registry. Contract versions follow per-type SemVer; `schemaVersion: 3` is the manifest structure, not the contract version.
- **Change detection:** consumer pins an immutable commit. On adoption of another commit, compare every used type's version and fingerprint, rerun projection checks/real validation, review semantic and behavior changes, and test affected screens. Never auto-accept a changed fingerprint or treat unchanged fingerprint as proof of runtime compatibility. New revision adoption is explicit; no implicit migrations.
- **Data:** no secret, personal information, tokens, private URLs, arbitrary CSS or executable code in specs, examples or diagnostics intended for publication. Host-provided remote capabilities are **never derived from JSON or Pi**. The existing same-origin adapter is not a public API. Authentication, authorization and sensitive actions remain external responsibilities under explicit review.
- **Failure:** missing files, invalid manifest, unsupported types/versions, validation errors, unknown fields, network failure or incompatible host behavior must fail closed. Do not silently fall back to experimental, unreviewed React implementations, or an older manifest format.
- **Operational boundary:** consumers must supply their own repository access, execution isolation, retry/rate policies, deployment credentials, runtime compatibility tests and error handling. No availability, distributed execution or authenticated remote validation is promised.

## What stays internal / explicitly not exposed

Underlying Zod/registry implementation modules (other than the explicit in-process contract SDK facade), component source paths, `SpecScreen` props, the Admission Engine's write/publish methods, experimental composition certificates, agent prompts and tools, source repositories and semantic indexes, local telemetry/event files, application state, arbitrary actions, network adapters, and CI credentials are **not public service APIs**. They may be visible in an open-source tree but are not stable integration commitments. In particular, do not add `/api/*`, MCP/tool calls, webhooks, `POST /generate`, `POST /validate`, actions, browser embeds, npm exports or an open network listener as part of E12 discovery.

## When to consider a larger interface

Only propose additional surface after a named external consumer demonstrates (a) a concrete task that pinned files + local CLI cannot solve, (b) expected volume, latency, trust/authentication and data sensitivity, (c) ownership of deployment, compatibility and support, and (d) a security review including E09/E10 boundaries. Prefer the next smallest incremental option: reproducible versioned artifact distribution before a network endpoint; a read-only query before a mutating operation. A remote validator would require isolation, quotas, request limits and redacted diagnostics; a renderer SDK would require a separately versioned package and host contract. Neither is authorized here.

## Verification and traceability

Evidence paths: [architecture](architecture.md), [Pi agents](agents.md), [admission lifecycle](admission-engine.md), [E09 isolation](pi-isolation.md), [data integration](integracao-dados.md), [contract versioning](contract-versioning.md), and [E10 events](pi-execution-events.md).

For this **documentation-only** change: run `npm run docs:check`, `npm run semantic:check`, `npm run semantic:report`, and `npm run test:offline` in a prepared checkout. These checks do not prove external consumer interoperability or certify browser E2E; the complete E2E suite remains manual on main. No Zod, contract lock, Pi permission, admission policy, HTTP route or published artifact shape is changed in E12.
