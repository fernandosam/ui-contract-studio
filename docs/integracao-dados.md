[English](integracao-dados.md) | [Português](integracao-dados.pt-BR.md)

# DataTable Data Sources

The `sourceId` property accepts only `demo-processos` and `processos-api` and is validated by the Zod catalog. Specs do not accept third-party URLs.

## `demo-processos`

A fictional local dataset with 57 rows. It simulates source-delegated pagination and search for testing without a server; no network access is used.

## `processos-api`

The application requests only `GET /api/ui-data/processos` (same origin, `credentials: same-origin`), with `page` (zero-based), `pageSize` (5–100), `search`, `sortKey`, and `sortDesc`. JSON response:

```json
{"rows":[{"id":"P1","values":{"processo":"P1","situacao":"Em análise"}}],"total":1}
```

A backend is **not provided** in this prototype. Implement it on the application server with authentication/authorization, input validation, actual limits, access filters, auditing, and error handling. Do not put remote addresses or secrets in an AI-generated schema.

Selection is tracked by IDs and can bind to `selectedIds` in json-render state. Local selection is preserved across pages, but bulk operations require their own authorized service. Values shown in tables remain plain text; HTML is not executed.
