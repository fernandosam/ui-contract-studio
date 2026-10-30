[English](pi-execution-metrics.md) | [Português](pi-execution-metrics.pt-BR.md)

# E10 — Offline Pi execution metrics

The metrics command reads existing [structured E10 events](pi-execution-events.md) **offline**, without invoking Pi, requiring credentials, changing catalog authority, or uploading traces. All output is JSON on stdout; it does not write files.

## Capture and report

Opt in to local structured events for cooperating commands with one shared UUID:

~~~bash
export UI_CONTRACT_EXECUTION_ID="$(node -e 'process.stdout.write(require("node:crypto").randomUUID())')"
export UI_CONTRACT_EVENTS_FILE=reports/pi-execution/events.jsonl
npm run pi:select -- --requirement="button action" --types=Button
npm run pi:context -- --types=Button --metadata-only --stdout
npm run pi:metrics -- --execution-id="$UI_CONTRACT_EXECUTION_ID"
~~~

For actual model generation measurements, paid Pi evaluation is **explicitly manual**; follow [Pi evaluation](avaliacao-pi.md), with PI_EVAL_CONFIRM=yes and optional PI_EVAL_REPAIR_CONFIRM=yes. The metrics command triggers no paid calls.

~~~bash
npm run pi:metrics -- --file=reports/pi-execution/events.jsonl
npm run eval:pi:report
npm run pi:metrics -- --include-evaluation
~~~

The --include-evaluation flag reads reports/pi-evaluation.json **only when explicitly requested**. This is separate evidence, not automatically correlated to an execution ID. Export stdout manually if required; reports/ is Git-ignored.

## Definitions

| Field | Definition |
| --- | --- |
| operations | Count of observed operations: completed, failed, blocked, and incomplete |
| latencyMs / byPhase.*.latencyMs | Measured terminal operation durations in milliseconds; sample count, mean, p50 and p95 |
| piGenerationAttempts | Real Pi generation invocations (first attempt or consented repair); started-only is incomplete |
| tokens.input/output | **Actual** nonnegative integer counters from Pi CLI usage on terminal generation attempts, with independent sample counts |
| contractValidation.passRate | Successful pi:validate operations divided by successful + failed terminal validations; does not measure UX |
| evaluationQuality | Separate Pi evaluation: first-pass, post-repair and repair success rates over **executed** scenarios, with not-run shown |

When there are no samples, rates, token totals and latency percentiles are **null (unknown), not zero**. A failed model invocation may consume tokens without exposing counters. The report gives sample coverage and is not a complete cost ledger. Durations are per operation, **not summed end-to-end latency** across concurrent CLI processes.

Pi evaluation checks Zod, graph invariants and required components. It is **not** an assessment of semantic accuracy, visual quality, accessibility, user satisfaction or E2E behavior. Missing outputs are not scored as success.

## Data safety and limitations

Events allow only bounded numeric attempt (1 or 2), inputTokens and outputTokens for the pi-eval generation phase, in addition to the previous closed allowlist. Usage is accepted **only on terminal events**; neither prompts nor model responses are logged. All records are validated; invalid or duplicate records cause fail-closed reporting. Interrupted operations are incomplete, not success. Sources must be regular JSONL files under reports/pi-execution/ (no symlink/traversal, max 16 MiB). Evaluation reports are local, bounded and Git-ignored.

This is a **diagnostic**, not automatic monitoring, admission evidence or a replacement for independent visual review. Establish local retention and access policy before storing telemetry.

## Verification

~~~bash
node --test tests/execution-metrics.test.mjs tests/execution-events.test.mjs
npm run test:offline
npm run semantic:check
npm run semantic:report
npm run docs:check
npm run validate
npm run build
~~~
