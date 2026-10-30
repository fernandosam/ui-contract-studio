[English](sdk-access-control.md) | [Português](sdk-access-control.pt-BR.md)

# E12 — Protected access to the local contract SDK

This is an **opt-in, server-only policy gateway** for the in-process [typed SDK](typed-contract-sdk.md). It does not open a port, expose an HTTP route, authenticate users by itself, issue JWTs/API keys, add Pi permissions, change Zod contracts, or enable publication/admission. The direct SDK is still callable by trusted local code: the gateway is only an enforcement boundary **when the application host routes untrusted calls through it**.

## Integration contract

A trusted server or worker must:

1. Parse its own authenticated transport. Derive `peerId` from trustworthy network metadata (for example, a reverse proxy that validates and overwrites forwarded headers), never from an untrusted client-provided field.
2. Provide `authenticate(bearerToken)`, which verifies signature or opaque-token introspection, issuer, audience, expiry, revocation and tenant/scopes as appropriate. Return `null` if unverified. **Decoding an unsigned JWT is not authentication.**
3. Construct reviewed `createContractSdk()` on the server. An experimental instance is optional and requires **both** explicit channel selection and the independently granted `contracts:experimental` scope.
4. Call `execute(trustedTransport, command)` for all external operations. The input command cannot supply identity or tenant; the gateway checks access and capacity before invoking the SDK.
5. Translate the returned `status` and `error` to a safe host response. Do not forward raw credentials, internal exceptions, rejected specs or raw identities into logs.

```ts
import { createContractSdk } from "../src/sdk";
import { createProtectedContractGateway } from "../src/sdk/server.mjs";

// identityProvider and transport come from the trusted application host.
// identityProvider.verify MUST perform real signature/introspection checks.
const gateway = createProtectedContractGateway({
  stableSdk: createContractSdk(),
  authenticate: token => identityProvider.verify(token),
});

const result = await gateway.execute(
  { peerId: transport.verifiedPeerId, bearerToken: transport.bearerToken },
  { operation: "validate", input: submittedSpec },
);
if (!result.ok) {
  // Send only result.status/error; respect retryAfterSeconds when present.
}
```

A host must not use this example as a standalone server: `identityProvider`, `transport` and `submittedSpec` are intentionally **host-owned**. The public permissions are `contracts:read` (list and inspect), `contracts:validate`, `contracts:generate` and `contracts:experimental` (additional gate only, never a replacement for the operation's scope). No wildcard or implicit administrator permissions exist.

## Defaults and failure behavior

| Control | Per-gateway default |
| --- | ---: |
| Pre-auth attempts per trusted peer | 60/minute |
| Pre-auth attempts globally | 5,000/minute |
| Authenticator calls in flight | 32 |
| Authenticated calls per tenant + subject | 120/minute and 2,000/UTC day |
| SDK calls in flight | 4 per tenant + subject, 32 globally |
| Serialized command size | 256,000 bytes |
| Command nodes / maximum nesting | 6,000 / 40 |
| Tracked peer / principal buckets | 2,000 / 10,000 |

The limits are validated and may be lowered for a specific trusted host. The gateway uses bounded per-instance fixed-window accounting. The request that exceeds a quota is denied before SDK invocation, and concurrency capacity is released after success and exception. Window boundaries permit normal fixed-window burst effects; quotas are **not a sliding-window or a billing guarantee**. Tokens and identifiers are not stored in plaintext in the limiter (internal keys use a per-instance HMAC); the raw bearer token only reaches the host's authentication callback.

Failures use sanitized codes: `401 unauthorized`, `403 forbidden`, `400 invalid_request`, `413 payload_too_large`, `429 rate_limited|quota_exceeded|busy`, and `503 unavailable`. Rate-limit and quota denials may supply a coarse `retryAfterSeconds`. Invalid specs returned by the SDK remain ordinary validated result values, not transport failures.

## Production constraints

- **Single-process only.** Each process has independent counters. With multiple replicas, deployments, retries or restarts, enforce **atomic distributed quotas** (e.g., at the gateway/Redis) and verify cross-instance behavior. Do not claim multi-instance quotas with this implementation.
- **No public endpoint by default.** HTTPS/TLS, CORS, CSRF (when cookie-authenticated), DDoS/WAF controls, network allowlists, request body parsing/streaming limits, trusted proxy configuration, credential rotation and revocation are host responsibilities. Authentication callbacks should have their own timeouts and cancellation; the gateway bounds concurrent authentication calls but cannot cancel a stuck identity provider. The SDK is synchronous and does not provide a CPU sandbox; isolate CPU and memory budgets at the worker/process level.
- **Not a token-consumption limit.** This gateway counts SDK requests, not LLM tokens, money or side effects. Any future billable generation needs separate metering, spending limits and idempotency at the real external service.
- **No permission expansion.** Never derive scopes from a Pi-generated JSON spec, examples, the semantic catalog, a user-selected tenant, or experimental admission evidence. The lock, Zod definitions and the Admission Engine remain authoritative.
- **No sensitive observability.** Correlate only sanitized status, operation and bounded metrics through the existing E10 infrastructure. Do not log bearer tokens, full peer IDs, subjects, tenant IDs or rejected user content.

## Verification

```sh
node --test tests/sdk-access-control.test.mjs
npm run semantic:check
npm run semantic:report
npm run test:offline
npm run validate
npm run build
```

Full browser E2E is intentionally deferred to the existing manual main-branch stage. These tests prove gateway behavior in one process with fake SDKs and credentials; they do **not** prove the security of a real OIDC verifier, deployment proxy, distributed store or any future HTTP endpoint.
