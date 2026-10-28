[English](semantic-e2e-risks-t29.md) | [Português](semantic-e2e-risks-t29.pt-BR.md)

# T29 — Regressão E2E orientada por riscos semânticos

A matriz de referência é [semantic-risk-cases.json](../tests/e2e/semantic-risk-cases.json), sem criar outro registro de implementação ou admissão. Os nove cenários Playwright ([semantic-risk-t29.spec.ts](../tests/e2e/semantic-risk-t29.spec.ts)) percorrem o explorador real de primitivas, o recomendador determinístico, a demonstração local de confirmação digitada e o catálogo oficial Pi, em **desktop e mobile**. P0 sinaliza risco de um agente de IA confundir orientação com API executável/autorizada; P1 cobre confusão entre evidência verificável e escolha de composição.

| Cenários | Prioridade | Origem rastreável | Invariante |
| --- | --- | --- | --- |
| R01 | P1 | AlertDialog `confirm-signal` e `focus-and-keyboard` | Evidência estática não comprova E2E nem autoriza backend. |
| R02–R03 | P0 | AlertDialog `typed-confirmation` / `checkbox-gating` | A *primitiva base* não oferece essas capacidades documentadas; composições admitidas separadamente não criam props implícitas na primitiva. |
| R04 | P0 | Recomendação `alert-remote` | Evento local de confirmação não permite exclusão remota; nenhuma requisição de rede. |
| R05 | P0 | Requisitos `alert-typed` / `alert-checkbox` | Pedidos desconhecidos e ambíguos não geram alvo inferido. |
| R06 | P1 | Receita `button-copy` para revisão | Exibir React/Zod proposto não admite contrato; catálogo oficial é independente. |
| R07 | P0 | Entrada de admissão, catálogo e certificado | Estado estável exige certificado E2E independente ligado ao digest de origem; caso contrário, prévia experimental exige opt-in. |
| R08 | P0 | Lacuna de confirmação digitada e teste derivado | Texto inválido bloqueia, cancelamento não confirma nem chama rede. |
| R09 | P1 | Recomendações `accordion-faq` e `accordion-members` | Reuso de primitiva não equivale a proposta de composição React. |

O verificador offline [semantic-e2e-t29.test.mjs](../tests/semantic-e2e-t29.test.mjs) compara cada ID, cenário, arquivo e capacidade relevante com `buildSemanticKnowledge().report.semanticCoverage`. Isso identifica cenários órfãos e divergências de evidência. A matriz não substitui a execução no navegador.

## Execução e evidências

```bash
node --test tests/semantic-e2e-t29.test.mjs
npm run semantic:check
npm run semantic:report
npx playwright test tests/e2e/semantic-risk-t29.spec.ts --project=desktop --project=mobile
npm run docs:check
npm run test:offline
```

Em PRs para a `main`, o job **admission-browser** do `quality.yml` passa a executar os nove casos com os testes existentes, sem workflow paralelo, permissão de escrita nem promoção. Os arquivos `reports/semantic-e2e/{desktop,mobile}/T29-Rxx.json` e capturas vão para o artefato **admission-browser-evidence**, inclusive com detalhes de falha. Cada JSON registra origem, risco, cenário, capacidade, SHA testado (quando disponível), tentativa, resultado, SHA-256 da matriz e `certification: not-granted`. Falhas bloqueiam Playwright; esses relatórios não certificam contratos. O E2E manual existente na `main` executa os mesmos casos por `npm run test:e2e`, preservando a certificação vinculada ao código.

O job offline-policy de T28 preserva `semantic:check` e `semantic:report` como validação de cobertura/frescor. Consulte o artefato **semantic-knowledge-report** e `reports/composition-analysis/semantic-knowledge.json` para relacionar lacunas e cenários. Presença de código e screenshot não comprovam acessibilidade completa, autorização remota ou permissões Pi.

## Registro de validação

Registrar SHA do check, resultados por navegador, `semantic:check`, `semantic:report`, testes offline e limitações **a partir de execuções reais**. A branch T29 deriva da T28 (com T26–T27) até a integração das PRs anteriores. As PRs T20–T24 de recomendação e propostas são independentes e não são incorporadas implicitamente; após integrá-las, atualizar a matriz com novas propostas, lacunas e controles de admissão.
