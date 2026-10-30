[English](pi-execution-trends.md) | [Português](pi-execution-trends.pt-BR.md)

# E10 — Offline Pi trends and dashboard

This report **reuses the same locally validated JSONL source and metrics aggregator** as [E10 metrics](pi-execution-metrics.md). It creates no new monitoring backend, API, permissions, model calls, dependencies or CI uploads; local logs follow the [E10 retention policy](pi-execution-log-policy.md). There is no live dashboard in the public app, since the local event log must not be exposed to the browser or bundled into a deployment.

## Generate reports

Opt in to event capture first as described in [E10 events](pi-execution-events.md), and run the commands in the project root:

~~~bash
npm run pi:trends -- --period=day
npm run pi:trends -- --period=week --limit=12 --format=csv > reports/pi-execution/trends.csv
npm run pi:trends -- --period=month --format=html > reports/pi-execution/dashboard.html
npm run pi:trends -- --format=json > reports/pi-execution/trends.json
~~~

Open the generated HTML file locally in a browser. No JavaScript, third-party assets or network connection are required. The CLI itself writes **only to stdout**; the shell redirects output to Git-ignored files under reports/. Do not redirect output over an existing JSONL input file. The input is reports/pi-execution/events.jsonl by default; --file=reports/pi-execution/<name>.jsonl accepts only another local E10 event file. An explicit missing file fails; missing implicit default gives an empty, visibly unavailable report.

Options: --period=day|week|month (UTC, default day), --limit=1..365 (last N **observed periods**, default 30), --format=json|csv|html (default JSON), --include-evaluation (optional independent evaluation snapshot; shown only in JSON and HTML).

## Charts and definitions

- Results by period: completed, failed, blocked and **incomplete/unknown** operations, never conflated with failures or passes.
- Latency: terminal operation p95 in ms; this is **not** end-to-end wall-clock duration across parallel processes.
- Tokens: actual Pi CLI input counters where available, with sample counts; missing counters show N/D rather than fabricated zeros. Output-token totals and sample counts are in the detail table, CSV and JSON.
- Validation: pi:validate completed / (completed + failed), not a quality score for UI or accessibility.
- Phase breakdown: planning, selection, generation and validation totals/latency.
- Optional --include-evaluation is a **single separate Pi evaluation snapshot** (Zod/graph/required-contract acceptance), not a time series and not correlated with the selected event window or inferred to be visual/semantic quality.

Series are sparse, not calendar-filled; missing days/weeks/months are **unknown**, not days with zero failures. Cross-midnight operations are grouped by their UTC **start** period. A terminal event without a start is incomplete/unknown and belongs to the terminal's observed period. The visible total covers only the latest N observed periods. JSON includes total-source event count, earlier-period indicator and explicit caveats; CSV includes only columns from visible periods, not event IDs or raw payloads.

## Safety and validation

The reader rejects paths outside reports/pi-execution/, symlinks, non-regular files, files above 4 MiB, expired events (older than 7 days), invalid events, duplicates and conflicting operation identities. No raw event fields, requirement text, prompts, payloads, paths or UUIDs are embedded in the rendered dashboard or CSV. HTML is static with a restrictive CSP, no network or executable scripts. Local results may still be operationally sensitive: review filesystem access, maintenance scheduling, exported copies and independent provider/CI retention before collecting data.

Run:

~~~bash
node --test tests/execution-events.test.mjs tests/execution-metrics.test.mjs tests/execution-trends.test.mjs
npm run test:offline
npm run docs:check
npm run semantic:check
npm run semantic:report
npm run validate
npm run build
~~~

No automatic Pi evaluation or full E2E run is implied. The full E2E suite remains manual on main.
