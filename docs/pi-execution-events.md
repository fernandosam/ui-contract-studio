[English](pi-execution-events.md) | [Português](pi-execution-events.pt-BR.md)

# E10 — Structured Pi execution events (v1)

This **optional diagnostic contract** does not change Pi permissions, Zod schemas, approved contracts or Admission Engine gates. To record the *selection rationale*, reviewed contract fingerprints and semantic evidence references, see [E10 Pi decision records](pi-decision-records.md).

## Identifiers and event shape

Each JSONL line is a closed record validated by [execution-events.mjs](../scripts/lib/execution-events.mjs).

| Key | Purpose |
| --- | --- |
| `schemaVersion` | Fixed integer 1, independent of the Pi UI schema version |
| `executionId` | UUID shared by cooperating CLI processes in one logical run |
| `operationId` | UUID for one phase attempt, reused in its start and terminal events |
| `eventId` | UUID unique to each emitted event |
| `sequence` | Increasing per recorder, never a global cross-process ordering |
| `timestamp` | ISO-8601 UTC emission time |
| `source` | requirements-preview, pi-select, pi-context, pi-eval, pi-validate |
| `phase` | planning, selection, generation, validation |
| `status` | started, completed, failed, blocked |
| `type` | Exact phase.status, e.g. validation.failed |
| `durationMs` | Monotonic duration, terminal events only |
| `details` | Closed allowlist of safe scalar metadata |

`details` only accepts nonnegative bounded `selectedCount`, `candidateCount`, `issueCount`, `blockerCount`; boolean `valid`; `channel` stable/experimental; `decision` recommended/ambiguous/no-match; and, for failed/blocked events only, `reasonCode`: input_invalid, catalog_unavailable, schema_missing, requirements_blocked, validation_failed or command_failed.

Actual Pi token **counts** (not content) are allowed as bounded numeric inputTokens/outputTokens on terminal pi-eval generation events; the optional attempt index is 1 or 2. The metrics reporter is described in [E10 metrics](pi-execution-metrics.md).

Never emit **prompt text, requirements, screen JSON, filesystem paths, user identifiers, model outputs, token content, exception messages/stacks, credentials or secrets**. Unknown fields and values are rejected, not serialized. Errors default to a generic fixed code.

## Instrumented entry points

- `requirements:preview` emits planning, permitted declarative generation, and Zod/compliance validation. Blocked plans emit generation.blocked and no fabricated validation pass.
- `pi:select` and `pi:context` emit advisory selection, not authorization.
- `eval:pi:run` emits generation per real Pi invocation/repair and retains its existing explicit paid-consent guard.
- `pi:validate` emits the actual existing Zod/graph validation result, issue count only; invalid specs remain nonzero exit status.

These commands are not automatically a workflow. Correlate separate commands by supplying the same execution ID through the environment; Pi evaluation subprocesses inherit the environment.

## Opt-in local usage

```bash
export UI_CONTRACT_EXECUTION_ID="$(node -e 'process.stdout.write(require("node:crypto").randomUUID())')"
export UI_CONTRACT_EVENTS_FILE=reports/pi-execution/events.jsonl
npm run pi:select -- --requirement="explicit button action" --types=Button
npm run pi:context -- --types=Button --metadata-only --stdout
npm run pi:validate -- --file=src/ui-screens/login.json --stdout
```

Without `UI_CONTRACT_EVENTS_FILE` no file is written, and CLI stdout/payload remains unchanged. Without a supplied UUID each command generates its own independent ID. Output paths are restricted to `reports/pi-execution/<name>.jsonl`, with traversal and symlink redirection rejected. The `reports/` directory is ignored by Git.

Example terminal event (illustrative, not actual execution evidence):

```json
{
  "schemaVersion": 1,
  "eventId": "cddfed7a-ff85-45b9-a4b1-80e1a6debe01",
  "executionId": "f9b1b6d2-ea18-4eea-8f78-b1712fdced1f",
  "operationId": "b2ade980-5da3-4e21-a8b1-e8d6d42c1234",
  "sequence": 2, "timestamp": "2026-10-29T12:00:00.000Z",
  "source": "pi-validate", "phase": "validation",
  "type": "validation.completed", "status": "completed",
  "durationMs": 35, "details": {"channel": "stable", "valid": true, "issueCount": 0}
}
```

## Limits and verification

Each operation has a started and terminal event when the process exits normally. SIGKILL, machine loss or interrupted I/O can leave a started event without terminal event; treat it as **unknown**, not success. Multi-process appends have no total order; group by executionId and operationId, using timestamp/sequence as hints only.

No automatic upload, CI artifact, retention policy or monitoring backend is introduced. Decide retention and access before collecting logs. Events are diagnostics, not proof of approval, authorization, successful E2E or correct model output.

Verify using `node --test tests/execution-events.test.mjs`, `npm run test:offline`, `npm run docs:check`, `npm run semantic:check`, `npm run semantic:report`, and full validate/build in an installed environment. See the [E09 threat model](pi-agent-threat-model.md).
