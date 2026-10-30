[English](pi-execution-log-policy.md) | [Português](pi-execution-log-policy.pt-BR.md)

# E10 — Local log privacy, retention, and cardinality

The E10 JSONL recorder is **opt-in**, local-only and closed-schema. Nothing here changes Zod UI contracts, Pi permissions, Admission Engine admission, external providers, or GitHub Actions log retention. These controls apply to files in reports/pi-execution/; they do not erase past CI logs, model-provider logs, backups or separately exported reports.

## Sensitive-data protection

The recorder accepts only fixed, validated source/phase/status/reason enums, bounded counters, boolean flags and random correlation UUIDs. It **rejects** unknown keys, free text, requirements, prompts, screen JSON, exception text/stacks, file paths, credentials and user identifiers *before persisting*. Raw diagnostic text must never be placed in event details. The \`redactSensitiveText\` utility masks common emails, CPF, authorization tokens, password/secret fields and token URL parameters for *other* operational diagnostics; it does not relax the event allowlist. Regex masking is defense-in-depth, not proof that arbitrary personal information is anonymized.

Stored execution, operation and event UUIDs remain present for local correlation; they are not intended as metrics labels or exposed in the aggregated HTML/CSV. Anyone with access to raw logs can still correlate actions, so limit filesystem access and delete exported copies independently.

## Enforced storage policy

| Limit | Default |
| --- | --- |
| Event expiration | 7 days from each event's UTC timestamp |
| JSONL files per E10 directory | 16 |
| Maximum bytes per file | 4 MiB |
| Events per file | 8,192 |
| Distinct execution IDs per file | 512 |
| Distinct operations per file | 4,096 |
| Events emitted by one recorder process | 1,024 |

On each opted-in event append, the recorder takes an exclusive directory writer lock, removes expired JSONL files, compacts expired lines in the active file and evicts the oldest eligible E10 file if the file count/aggregate byte quota is exceeded. Files unrelated to the E10 JSONL filename contract are never removed. Compaction is performed by atomic replacement; ordinary new events append through a no-follow file descriptor. Unsupported paths/symlinks, malformed prior events, missing locks, quota overruns and unsafe timestamps **fail closed**. This is bounded local storage, not a lossless audit ledger: eviction or incomplete operations may reduce trend coverage.

Reports are read-only and exclude events older than 7 days even before maintenance. A report may show sparse or missing periods; this must not be interpreted as zero failures. Limits restrict memory and label cardinality; no user ID, prompt, URL, filename or free-form text becomes a metrics dimension.

## Maintenance when logging is idle

~~~bash
npm run pi:logs:prune
npm run pi:logs:prune -- --apply
node --test tests/execution-log-policy.test.mjs
~~~

The first command only previews counts; \`--apply\` compacts/removes expired data and enforces the file-count limit. It reports counts only, no filenames, UUIDs or payloads. Run it under an OS scheduler when a strict deletion deadline matters; no automatic background daemon or scheduled workflow was added. A stale \`.e10-writer.lock\` after a crash blocks new writes/maintenance and must be removed **only after verifying there is no active writer**. No guarantee of secure erasure from snapshots or storage backups is made.

Operators should rotate or choose another valid log filename before a quota is exhausted; there is no silent drop of data. Audit local permissions, filesystem backups and the provider's separate retention policies before any real-data usage. See [E10 events](pi-execution-events.md), [metrics](pi-execution-metrics.md) and [trends](pi-execution-trends.md).
