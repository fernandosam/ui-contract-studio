[English](performance-baselines.md) | [Português](performance-baselines.pt-BR.md)

# E11 — Offline performance and load baselines

The E11 runner measures **real local CLI flows**, not synthetic Pi responses. It does not call models, submit forms, change catalogs, contact external endpoints, or approve any contract. It is manual/on demand, never a default blocking CI load test.

## Representative scenarios

| Scenario | Real path | Covered work |
| --- | --- | --- |
| select-narrow | Button/AlertDialog selection | Startup, contract checks, semantic knowledge and reasons |
| select-wide | Broad Pi selection | Reviewed catalog, candidate scoring and comparison |
| context-real-schema | Four Pi components | Real JSON schemas and semantic advice (not metadata-only) |
| plan-simple | Minimal local-demo registration | Planning, JSON generation and compliance |
| plan-rich | Multi-field local-demo registration | Two-column field grouping, JSON generation, compliance |
| validate-screen | Existing login JSON screen | Zod validation and structural graph invariants |

Registration inputs are fixed, non-sensitive, temporary files under reports/requirements/ that are deleted after the run. Validation uses src/ui-screens/blocos-login.json. Changes to screen, contracts or semantic knowledge change the workload: record the source revision. Browser rendering, network, live AI generation, paid tokens and backend throughput are out of scope.

## Execute

Requires **Node.js 22+**, installed locked dependencies and a controlled idle machine:

~~~bash
npm ci
npm run perf:baseline
# Small exploratory run (not an approved baseline):
npm run perf:baseline -- --iterations=5 --warmup=0 --concurrency=1 --scenarios=select-narrow,validate-screen --out=reports/performance/smoke.json
~~~

Default: 20 measured child processes per scenario/concurrency, two warmups per group, concurrency **1 and 4**, a 30-second timeout per child and 4 MB combined output budget. Six scenarios yield 240 measured attempts plus warmups. The local atomic report is reports/performance/e11-latest.json and is gitignored. Options: --iterations=5..200, --warmup=0..10, --concurrency=1,4 (values 1..8), --scenarios=..., --timeout-ms=100..120000 and --out=reports/performance/name.json. All commands/scenarios and paths are allowlisted.

**Latency includes CLI startup and module loading.** Each sample is a separate process and a worker pool shares N total attempts (not N per worker). Warmups are excluded from throughput/latency. Stdout/stderr payloads are discarded, and E10 event logging is disabled in benchmark children to avoid leaking data or skewing timings. Browser E2E and live Pi evaluation remain separate.

## Report semantics

Each (scenario, concurrency) result includes attempts, successes, failures, warmup failures, error rate, wall time, successful throughput in operations/second and min/mean/p50/p90/p95/p99/max duration in milliseconds (nearest-rank percentile). Percentiles include **only successful samples**, but failed, nonzero, timeout and oversize attempts are counted separately. Failed warmup suppresses that group's measurements. Any failure makes the snapshot **incomplete** and sets nonzero exit status. Unknown values are null, never invented zeros. Values are rounded to two decimals.

The report contains scenario IDs, aggregate numbers, UTC timestamp, Node version, OS, CPU model/count, total memory and Git revision (when available). It excludes prompts, screen JSON, stderr, credentials, paths from user data and execution IDs. Peak application RSS/CPU, browser user experience and token cost are **not measured** here.

## Reference approval and comparison

1. Run the **full default profile at least three times** on the same idle hardware, Node version, lockfile and revision. Verify all are complete with zero errors and examine dispersion; never select the fastest result by convenience.
2. Independently review one representative measured JSON and commit it under benchmarks/baselines/ with the machine, revision, run date and reviewer documented in the PR. Until then **no measured reference exists**. Never publish estimated or fabricated measurements.
3. On a comparable later revision, run:

~~~bash
npm run perf:baseline -- --compare=benchmarks/baselines/approved-reference.json
~~~

The comparator rejects incomplete snapshots and requires matching Node version, OS/architecture, CPU model/count, iteration count, warmups, timeout and exact scenario/concurrency matrix. It flags p95 increases **over 20%** or successful throughput decreases **over 15%**. Errors invalidate the comparison regardless of thresholds. This is an investigation signal, **not** a production SLA or automatic release veto: thermal throttling, contention, cold starts and measurement variance matter.

See the [reference policy](../benchmarks/baselines/README.md) and [E10 events](pi-execution-events.md). Validate with npm run test:offline, docs:check, semantic:check, semantic:report, validate and build, when dependencies are available. Full E2E remains manual on main.

## Load, concurrency and regression verification (E11)

The opt-in load suite wraps the **same** offline runner and uses a deterministic workload matrix; it does not introduce another benchmark implementation. It is not added to the standard CI gate.

| Profile | Command | Scenarios | Measured attempts per scenario × concurrency | Parallel child processes | p95 ceiling | Success throughput floor |
| --- | --- | ---: | ---: | --- | ---: | ---: |
| Smoke | `npm run perf:load:smoke` | 2 | 5 | 1, 4 | 25,000 ms | 0.05 op/s |
| Load | `npm run perf:load` | 6 | 20 | 1, 2, 4 | 25,000 ms | 0.10 op/s |
| Stress | `npm run perf:load:stress` | 3 | 20 | 1, 4, 8 | 30,000 ms | 0.10 op/s |

Each case also requires **0% errors**, zero warmup failures, the exact number of expected successful attempts, matching scenario/concurrency matrix, positive wall time, valid latency percentiles and a Git commit SHA. The runner's **30,000 ms child timeout** and 4 MB combined output limit still apply. p95 and throughput values are aggregates per (scenario, concurrency), not per-thread SLAs. Failure produces non-zero exit status. The limits above are **provisional diagnostic guardrails**, not approved production SLAs or measured baselines; validate against the reference hardware and adjust through review if inappropriate.

For regression detection, first approve a **real** compatible reference using the earlier protocol. Then supply it to any profile:

~~~bash
npm run perf:load -- --compare=benchmarks/baselines/approved-reference.json
npm run perf:load:stress -- --compare=benchmarks/baselines/approved-stress.json
node --test tests/performance-baseline.test.mjs tests/e11-load-gate.test.mjs
npm run semantic:check
npm run semantic:report
~~~

The existing benchmark comparator rejects incompatible profiles/machines, increases in **p95 over 20%** and drops in **successful throughput over 15%**. No reference means **comparison not performed**, not “regression passed”. A missing/incomplete/invalid reference is a failure. Local reports remain gitignored at `reports/performance/e11-smoke.json`, `e11-load.json` and `e11-stress.json`; they contain aggregate data and environment identifiers, not child outputs or user inputs.

For a meaningful result, execute on an idle machine with locked dependencies and a full Git checkout, repeat runs, inspect variation and save only independently reviewed evidence. Concurrent child processes are **CLI workload pressure**, not HTTP users or a realistic backend production capacity test. Do not run this suite as a default PR check or publish reports containing workstation metadata without review. Full E2E testing remains manual on `main`.
