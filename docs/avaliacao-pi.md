[English](avaliacao-pi.md) | [Português](avaliacao-pi.pt-BR.md)

# Pi Generation Evaluation (20 Scenarios)

The list in `tests/prompt-evals/scenarios.json` contains prompts and minimum expected contracts. **The prompts were not executed by Pi as part of this delivery**. Do not interpret them as a model quality score.

1. Create the `eval-results/` directory (Git-ignored).
2. Run Pi for each scenario and save **the JSON spec actually produced** to `eval-results/<id>.json` without changing the types required by the scenario.
3. Run `npm run eval:pi` for diagnostics; it records `pass`, `fail`, or `not-run` in `reports/pi-evaluation.json`.
4. Run `npm run eval:pi:strict` to require execution of all 20 scenarios.
5. Evaluate visual quality, semantics, security, and real tasks separately; the checker does not measure these subjective criteria.

The script does not automatically invoke Pi or attempt to bypass approvals or fabricate specs to achieve a maximum score.
