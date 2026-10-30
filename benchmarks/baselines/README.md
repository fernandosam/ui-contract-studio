# E11 approved baseline snapshots

This directory intentionally contains **no numeric snapshot yet**. A baseline becomes authoritative only after running the E11 offline benchmark on documented hardware and independently reviewing complete, zero-error results in a pull request.

Use at least three runs with the same Git revision, lockfile, Node version, machine and profile; check variability and choose a representative measurement rather than the fastest one. Document the machine, CPU, Git revision, execution date and reviewer in the approval PR. Commit a measured JSON here and use the --compare option of npm run perf:baseline on subsequent comparable revisions.

**Do not infer an SLA, performance budget, or numerical result from the existence of this runner.** See the [English protocol](../../docs/performance-baselines.md) and [Portuguese protocol](../../docs/performance-baselines.pt-BR.md).
