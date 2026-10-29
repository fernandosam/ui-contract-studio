[English](e09-sensitive-actions.md) | [Português](e09-sensitive-actions.pt-BR.md)

# E09 — Explicit authorization, parameter validation and sensitive-action confirmation

## Trust boundaries

A generated Pi JSON spec may select only cataloged actions. The runtime validates specs with the real Zod catalog and graph invariants before rendering. Local `buttonClick`, `formSubmit` and `linkClick` handlers now revalidate parameters immediately before displaying feedback. The built-in state actions remain **local only**; unsafe state paths (`__proto__`, `constructor`, `prototype`) are rejected by graph validation.

**No Pi action can call a remote adapter, mint a confirmation ticket, or set server permissions.** Displaying a confirmation dialog in a generated composition is not authorization.

The existing `/__demo__/submit` test-host adapter illustrates the **sensitive write** boundary. A trusted host must supply all of:

1. A valid authenticated session resolved server-side, with user, tenant, and permitted service.
2. Valid request parameters: strict JSON shape, approved service, bounded fields and a valid idempotency key.
3. A valid Origin, CSRF token and `x-action-confirmation` header.
4. An independently verified, one-use confirmation ticket tied to **user + tenant + service + idempotency key + exact submitted fields**.

The HTTP constructor requires `verifyConfirmation(ticket, payload, session)`. Missing or false verification fails closed (403), before the write adapter and before idempotent receipt lookup. Raw client-supplied booleans do not count as confirmation. An exception from the verifier also denies the request. The backend additionally demands a trusted `confirmationVerified: true` context flag, which is created by the HTTP adapter only after the server-side check.

## Host integration (not Pi integration)

`createSubmissionConfirmations()` is an in-memory, bounded, 90-second demonstration store. A trusted host calls `issueAfterApproval(payload, identity)` **only after the person has explicitly approved the exact operation** in the host-owned UI. The generated spec, local preview, and any public request endpoint must never receive the issuance capability. The host injects:

```ts
const confirmations = createSubmissionConfirmations();
const handler = createControlledDemoHttpHandler({
  allowedOrigin: "http://127.0.0.1:5173",
  services: [approvedDemoService],
  resolveSession: trustedSessionResolver,
  verifyConfirmation: async (ticket, payload, session) =>
    confirmations.consume(ticket, payload, session),
});
```

After explicit approval in the host, issue a ticket for the exact payload and authenticated identity and submit it in the `x-action-confirmation` header. Each HTTP attempt requires a fresh ticket; replay, expiration, altered parameters and cross-tenant/user use fail closed. The adapter remains loopback-only and is not a production API.

The host **must not** expose a public “issue ticket” endpoint that issues proof without a separately authenticated, user-initiated confirmation. This process-local store is unsuitable for multi-instance production deployments: use server-side durable, atomic, expiring, identity/request-bound consent storage and independently enforced service authorization. A trusted backend must still validate permissions and business rules at execution time. Do not place credentials, bearer tokens or secrets in generated JSON or confirmation summaries.

## Regression checks

- `npx tsx --test tests/action-execution-boundary.integration.test.ts tests/submission-confirmation.integration.test.ts tests/submission-backend.integration.test.ts tests/submission-http.integration.test.ts`
- `npx playwright test tests/e2e/submission-controlled-http.spec.ts --project=desktop --project=mobile`
- `npm run test:offline && npm run pi:zod-schema && npm run validate && npm run build`

Security boundary edits require ordinary PR review; native auto-merge eligibility excludes the submission modules and spec invariants. All catalog admission and semantic checks remain unchanged.
