[English](e12-test-matrix.md) | [Português](e12-test-matrix.pt-BR.md)

# E12 — Automated contract, compatibility, security and integration tests

This suite covers the **existing local TypeScript SDK** and the **opt-in trusted-host gateway** from PR #197. No HTTP API, npm SDK package, real identity provider or Pi action execution is introduced.

| Gate | Files | What it proves |
| --- | --- | --- |
| Contract/compatibility | `tests/e12-contract-compatibility.integration.test.ts` | Stable vs experimental selection; inspected metadata equals the reviewed lock/Pi projection; SemVer shape, fingerprint, historical pin drift, deterministic generation and safe rejection |
| Security/adversarial | `tests/sdk-access-control.test.mjs`, `tests/e12-gateway-security.test.mjs` | Host identity and scopes, quota windows, tenant isolation and concurrency, input bounds, prototype pollution/accessors, sanitization and failure release |
| In-process end-to-end | `tests/e12-gateway.integration.test.ts` | Trusted identity -> protected gateway -> real SDK -> list/inspect/generate/validate -> returned JSON, including denied and invalid cases |
| Existing regression | `tests/contract-sdk.integration.test.ts`, E07 migration/compatibility tests | Zod, graph invariants, version policies and legacy migrations |
| Review gates | `semantic:check`, `semantic:report`, `validate`, `build` | Knowledge audit, complete repository checks and production build |

## Commands

```sh
npm ci
npm run test:e12
npm run test:offline
npm run semantic:check
npm run semantic:report
npm run validate
npm run build
```

The quality workflow executes E12 explicitly in its dependency-installed integration job. The normal `test:offline` and `tests/*.integration.test.ts` discovery also includes these files. Tests must fail the job on regression. No credentials, outside network calls or nondeterministic timers are required.

## Limits and release policy

- **End-to-end here means in-process integration**, not an HTTP deployment, actual OIDC introspection, multi-replica rate limiting, external consumer packaging, or browser UI certification. Those require independent environment-specific checks.
- The gateway only enforces policy if an application host **routes all untrusted requests through it** and verifies transport/authentication. Host proxy/TLS/CSRF/timeouts/distributed quotas remain external responsibilities.
- E12 does not approve new contracts, modify Zod, change Pi permissions or promote Admission Engine candidates. Per-contract SemVer/fingerprint classification and the mandatory semantic audit remain independent review gates.
- Full browser E2E and visual certification remain manual on `main` via the existing workflows. Do not mark them passed from these local tests.
