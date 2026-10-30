[English](typed-contract-sdk.md) | [Português](typed-contract-sdk.pt-BR.md)

# E12 — Typed contract SDK (local TypeScript)

The public integration surface is a **local, in-process facade** over the reviewed contract lock, Pi projection, real Zod definitions and graph policy. It is not a hosted HTTP API, npm-published package, model generation client, contract-admission interface or backend authorization system.

For an end-to-end quickstart, reviewed revision pins and standardized consumer-side error handling, see the [E12 integration guide](integration-guide.md) and its [tested example](../examples/integrations/contract-sdk.ts).

## Public operations

- `createContractSdk()` defaults to `stable`. `createContractSdk({ channel: "experimental" })` explicitly opts into the experimental catalog.
- `list()` returns versioned public metadata, events and slots for available contracts.
- `inspect(type)` returns the same metadata and a JSON Schema projection of the real Zod props definition, or `null` for unavailable/unverified contracts.
- `validate(spec)` checks JSON safety, real Zod rules, graph/action restrictions and the reviewed-lock/Pi-manifest identity. Returns `{ valid, spec, issues }` on success or `{ valid, issues }` on failure.
- `generate({ root, nodes, state? })` deterministically constructs a JSON spec from approved nodes, supplies empty `children` arrays and runs the same validation before returning any spec. It never calls an AI model.

## Example

```ts
import { createContractSdk } from "../src/sdk";
const sdk = createContractSdk();
const card = sdk.generate({
  root: "intro",
  nodes: [{ id: "intro", type: "Card", props: { title: "Hello", description: null } }],
});
if (!card.valid) throw new Error(card.issues.map(issue => issue.code).join(", "));
const inspected = sdk.inspect("Card");
console.log(inspected?.version, inspected?.fingerprint);
```

## Safety and versioning

Generation means generating **screen specifications from available contracts**, never creating/admitting new contracts. TypeScript infers reviewed props from current definitions; experimental types are runtime-checked, not assumed approved. The library does not expand Zod schemas, write a screen file, execute local actions, enable remote data, access private user information, publish artifacts or change Pi capabilities. No external network is used.

Fail closed on mismatches between approved lock and generated manifest (including fingerprint), invalid input, unknown types or disallowed events/actions. Input/output are bounded plain JSON; error messages contain paths and codes, not rejected prop values. Validation cannot replace server authorization or independent E2E review.

Use this source-level import inside this repository; no public semver package or HTTP endpoint is promised. Compatibility is governed by the existing per-contract SemVer and fingerprint policy.

## Verification

```sh
npx tsx --test tests/contract-sdk.integration.test.ts
npm run semantic:check
npm run semantic:report
npm run validate
npm run build
```

Browser E2E and real external-app integration remain separate follow-up gates.
