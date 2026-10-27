# T32 — Boundary for approved submission services

Reviewed 2026-10-27. The UI Contract Studio is a frontend-only Vite app. `createSubmissionGateway` is a **server-side integration interface**, not a remotely callable endpoint, Pi action, or production authorization.

A trusted host must inject each `ApprovedService`, derive `SubmissionContext` from an authenticated server session, verify CSRF, tenant scoping, and allowed actions; a browser or generated JSON must **never** populate those authorities. `defaultSubmissionGateway` registers no services. The separate `createInMemoryDemoService` fixture registers `users-demo` only when explicitly injected in tests. It accepts only name/email and stores ephemeral records scoped by tenant, deliberately not a credential vault or production database.

The gateway checks identifiers and input sizes, refuses unknown services, deduplicates concurrent requests, rejects reuse of idempotency keys with different bodies, uses AbortSignal-based timeouts and maps unexpected adapter errors to sanitized messages. **Process-local idempotency and an abort signal cannot guarantee at-most-once writes across server replicas or retries.** Production adapters must enforce durable transaction-level idempotency, authorization, audit controls, structured error handling, CSRF and tenant checks, timeouts and encryption; these require separate security review.

Security limits: no arbitrary URL/SQL/JS, no network operation, no new Pi events, Zod permissions, manifest entries, or client-side authorizations. A real API cannot be implemented until identity and a specific authorized service are known.

Verification: `npm run validate`, `npm run build`, `npx tsx --test tests/submission-backend.integration.test.ts`. The tests cover authorized success, duplicate conflict, authorization failures, concurrency, timeout, retry and sanitized adapter errors. Browser tests for actual persistence must wait until an approved server exists.
