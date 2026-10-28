# T23 — Propostas de composição a partir de lacunas semânticas

A T23 reutiliza a auditoria T22 (`buildSemanticKnowledge().report.capabilityAudit`) e os cenários revisados do recomendador em `src/ui-catalog/recommendations/scenarios.json`. Uma proposta é criada **somente quando** um cenário revisado exige explicitamente uma capacidade classificada como lacuna na T22. As demais aparecem em `uncoveredGaps`, sem inferência de API ou implementação.

Cada proposta `gap-<scenario-id>` preserva componentes e identificadores das lacunas de origem, caminho da fonte, motivo e verificações de evidência T22, capacidades necessárias, evidências estáticas disponíveis, dependências no lock, limitações de implementação e admissão e testes *planejados*. Os estados são `candidate-review-only`, `runtime-review-required`, `blocked-implementation`, `blocked-evidence` e `blocked-authorization`. Uma candidatura React **não é executável** antes da implementação e admissão independente. Ausência de evidência **não comprova** ausência de código; evidência estática **não certifica** runtime.

O recomendador existente expõe `Recommendation.gapProposals` para as famílias piloto revisadas e o explorador apresenta origem e restrições. O navegador utiliza metadados curados, marcados como *not-verified-in-browser*; a verificação autoritativa de trechos de código da T22 ocorre no Node via `semantic:check` / `semantic:report`.

Executar `node --test tests/semantic-composition-proposals.test.mjs`, `npx tsx --test tests/composition-recommender.integration.test.ts`, `npm run composites:recommend:check`, `npm run semantic:check` e `npm run semantic:report`. Este último gera `reports/composition-analysis/semantic-composition-proposals.json` além dos dois relatórios T22. A saída é consultiva, jamais uma nova especificação Pi admitida.

**Limite de segurança:** sem modificações de `contracts.lock.json`, catálogo Pi, schemas Zod existentes, motor de admissão, executor de capacidades ou permissões. Implementação, testes, revisão e admissão formais continuam sendo controles separados.
