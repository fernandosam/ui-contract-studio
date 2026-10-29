[English](semantic-knowledge-checklist.md) | [Português](semantic-knowledge-checklist.pt-BR.md)

# Checklist de enriquecimento semântico de componentes (T01)

**Referência inicial:** `src/ui-catalog/knowledge/alert-dialog.json` (AlertDialog). **Última revisão deste procedimento:** 2026-10-26. A camada é **documental e consultiva**: não modifica schemas Zod, contratos, tipos ou permissões do catálogo Pi, e não certifica E2E.

## Onde procurar antes de criar qualquer coisa

1. **Reutilize os guias por família**, sem duplicá-los: `src/ui-catalog/reui-guidance.json`, `src/ui-catalog/shadcn-guidance.json` e `src/ui-catalog/semantic-contract-guidance.json`. O agregador `scripts/lib/semantic-knowledge.mjs` combina essas orientações com os overlays individuais de `src/ui-catalog/knowledge/`.
2. **Consulte os contratos reais** em `src/ui-catalog/contracts.lock.json`, `src/ui-catalog/catalog.ts`, `src/ui-catalog/extensions/catalog.ts` e `pi-catalog/contracts.json`. Procure as implementações em `src/ui-catalog/extensions/components/`, `src/components/ui/` e, separadamente, as composições `src/ui-catalog/extensions/composites/` e a distribuição experimental `src/ui-catalog/admission-engine/`. Uma implementação experimental não prova suporte no contrato primitivo.
3. **Localize a fonte documental original** (ReUI `https://reui.io/components/<slug>`, preferindo também `/components/<slug>.md` quando acessível) e confira a variante shadcn efetivamente instalada (Base UI, Radix ou outra). Para o piloto: [ReUI Alert Dialog](https://reui.io/components/alert-dialog) e [shadcn Alert Dialog — Base UI](https://ui.shadcn.com/docs/components/base/alert-dialog). Não trate exemplos ou FAQ do fornecedor como prova de implementação no projeto.
4. Use o formato e a validação já existentes em `scripts/lib/semantic-knowledge.mjs`; **não crie um novo schema, validador ou fonte de verdade** para essa tarefa.

## Checklist por componente

Marque cada item só depois de inspecionar as fontes e a implementação correspondente.

- [ ] **Identidade e proveniência:** arquivo `src/ui-catalog/knowledge/<slug>.json` com `schemaVersion: 1`, `component` em PascalCase, `language: "pt-BR"`, `status` (`draft` ou `reviewed-documentation`), `source.provider`, URL oficial exata, seções consultadas e `source.reviewedOn` em `AAAA-MM-DD`. `reviewed-documentation` registra curadoria documental, **não** aprovação funcional.
- [ ] **Finalidade:** `purpose` explica a decisão ou tarefa do usuário que o componente resolve (não apenas sua aparência).
- [ ] **Justificativa:** `rationale` explica o benefício e o risco evitado, sem prometer efeitos ou comportamento não verificados.
- [ ] **Quando usar / evitar:** `whenUse` e `whenNotUse` trazem situações concretas, limites e alternativas adequadas (por exemplo, Alert versus Dialog versus AlertDialog).
- [ ] **Notas para agentes:** `agentNotes` explicita diferenças entre variantes, regras de composição, acessibilidade, estado e segurança; descreve restrições reais de Zod/Pi, sem recomendar props, ações remotas ou handlers inexistentes.
- [ ] **Inventário de capacidades:** cada item de `capabilities` contém `id` estável e único, `description`, `state`, `evidence` e `testRequirements`. Use exclusivamente os três estados da seção seguinte.
- [ ] **Evidência no código:** para cada capacidade marcada `implemented-static-evidence`, cite ao menos um par `{ "path": "src/...", "contains": "trecho exato" }` presente no código versionado. Verifique que o trecho sustenta a afirmação; a validação automática comprova existência textual, **não** execução, qualidade, cobertura ou autorização. Não use evidência de preview/experimental para alegar suporte do componente estável.
- [ ] **Integrações candidatas:** `integrations` contém `component`, `relationship` e `reason`, com indicação documental de por que compor. Consulte dependências reais; **candidata não é dependência implementada, tipo Pi aprovado ou permissão**.
- [ ] **Decisões de FAQ:** `faqDecisions` resolve dúvidas em critérios objetivos (`question`/`guidance`), inclusive quando preferir componente alternativo, exigir confirmação adicional ou delegar execução ao backend autorizado.
- [ ] **Testes derivados:** `derivedTestCases` tem `id` único, `kind` válido, `description` verificável e IDs de `capabilities` existentes. Associe critérios estáticos, interações, teclado/foco, responsividade e risco. Candidatas ainda não implementadas devem usar `candidate-not-executable`; não declare execução sem evidência real.
- [ ] **Fronteira de escopo:** o diff não altera `src/ui-catalog/extensions/catalog.ts`, `src/ui-catalog/catalog.ts`, schemas Zod, `pi-catalog/`, admissão ou permissões Pi. Uma evolução funcional posterior é tarefa separada, com revisão própria.
- [ ] **Rastreabilidade:** registre data da revisão, fonte consultada, caminhos de evidência, lacunas de validação e quais comandos/testes efetivamente passaram.

## Estados permitidos para capacidades

| Estado | Use quando | Evidência e teste |
| --- | --- | --- |
| `implemented-static-evidence` | O **contrato alvo** já expõe a capacidade e há implementação local localizada | `evidence` não vazio, com caminho `src/` e trecho literal existente; teste recomendado não equivale a execução |
| `documented-not-implemented` | O fornecedor descreve a capacidade, mas o **contrato alvo** não a oferece | `evidence: []`; registrar necessidade futura e `candidate-not-executable` para testes de proposta |
| `runtime-review-required` | A documentação ou a estrutura sugerem comportamento, mas a qualidade depende de navegador, teclado, leitor de tela, dispositivo ou fluxo real | `evidence: []`; teste E2E/manual pendente, sem certificado implícito |

**Exemplo do AlertDialog:** `confirm-signal` é implementado com `emit?.("confirm")`, não executa exclusão remota; `typed-confirmation` não pertence à API do AlertDialog básico, mesmo que exista um composto experimental separado; `focus-and-keyboard` continua pendente de revisão em execução. `AlertDialogAction` na variante Base UI é um `Button` comum, e o adaptador fecha o estado explicitamente.

## Procedimento de revisão e validação

1. Examine orientação por família, fonte oficial, contrato e implementação. Faça um overlay individual **somente quando** as regras específicas merecerem curadoria adicional.
2. Redija as seções em português, compare alegações com o código e vincule os testes às capacidades; mantenha lacunas como lacunas.
3. Execute no diretório raiz:

   ```bash
   npm run semantic:check
   npm run semantic:report
   npm run docs:check
   npm run test:offline
   ```

4. `semantic:check` falha para evidência ausente/desatualizada, nome/arquivo divergente, fonte não oficial ou IDs inválidos. `semantic:report` valida novamente e gera `reports/composition-analysis/semantic-knowledge.json`, **relatório derivado**, não autoridade contratual. Inspecione `profiles`, `implementationGaps`, `integrationCandidates` e `coverage` sem interpretar orientação como permissão. Para diagnóstico de um perfil: `npm run semantic:context -- --component=AlertDialog`.
5. Registre resultados reais, limites e caminhos modificados na entrega/PR. Revisão documental e testes estáticos **não** substituem E2E ou homologação estável. Não edite resultados derivados nem o catálogo Pi para fazer o relatório passar.

**Critério de pronto da T01:** AlertDialog auditado contra implementação e fontes, checklist versionado e descobrível neste índice, `semantic:check` e `semantic:report` executados com resultados registrados, nenhum schema Zod/permissão Pi modificado.

## T26 — Relatório único e auditável de cobertura semântica (27/10/2026)

`npm run semantic:check` valida as fontes e os trechos literais de evidência em `src/`, sem escrever relatório. `npm run semantic:report` valida novamente e atualiza o **mesmo arquivo derivado existente**, `reports/composition-analysis/semantic-knowledge.json` (ignorado pelo Git); não cria relatórios concorrentes. O job `offline-policy` da CI executa ambos, e `tests/semantic-coverage-t26.test.mjs` integra `npm run test:offline`.

Consulte `semanticCoverage` no JSON gerado:

- `sourcePaths` identifica o inventário versionado ReUI, a orientação por família, os overlays e `profiles[].capabilities[].evidence[]`, com os pares literais `path`/`contains`. `reuiExampleProfiles[]` relaciona cada ID do inventário ao caminho real do código.
- `totals` separa famílias e componentes com overlays revisados dos perfis apenas orientativos; conta separadamente capacidades com **evidência estática no código**, **documentadas mas não implementadas** e **pendentes de revisão em execução**. `implementationGaps` conta somente as não implementadas; `insufficientRuntimeEvidence` conta as que precisam de revisão em runtime. Nenhuma dessas contagens concede autorização.
- `families[]` é derivado das famílias **reais** do inventário/orientações ReUI e informa `inventoryExampleIds` ordenados, contagens e arquivos dos overlays. Overlay ausente constitui **lacuna documental**, não prova de ausência de implementação. AlertDialog e os demais overlays adicionais não são inventados como famílias ReUI.
- `components[]` inclui registros enriquecidos e perfis só com orientação. Os IDs de capacidades apontam para `profiles[].capabilities[]`, com descrições, estados e trechos exatos verificados no código. `piContractListed` apenas reflete o lock existente, enquanto `authorization: not-granted-by-semantic-coverage` não admite APIs, permissões ou contratos.

**Base de reconciliação (T19, 27/10/2026):** 31 famílias ReUI, 559 exemplos versionados, 39 overlays (31 famílias e oito componentes adicionais), 230 capacidades com evidência estática, 126 documentadas e não implementadas e 88 pendentes de revisão em execução. T26 recalcula esses números a partir das fontes, sem constantes fixas. O novo teste compara inventário, componentes, estados e evidências literais com os arquivos originais, além de verificar casos de lacunas e a regeneração pelo CLI. Testes estáticos não comprovam E2E, acessibilidade, admissão ou permissões Pi.

## T27 — Diagnósticos de desatualização do código (27/10/2026)

A T27 amplia **o mesmo** fluxo e relatório semântico. Use `npm run semantic:check` para validação textual e diagnósticos acionáveis no stderr; `npm run semantic:report` valida novamente e gera `reports/composition-analysis/semantic-knowledge.json` com `semanticFreshness.summary`, `semanticFreshness.components[]` e `semanticFreshness.diagnostics[]`. Consulte um componente com `npm run semantic:context -- --component=AlertDialog` (inclui `codeFreshness` e diagnósticos). Não é criado outro relatório, snapshot contratual ou autorização Pi.

Somente capacidades `implemented-static-evidence` com evidências literais em `src/` são verificadas. Cada diagnóstico relaciona arquivo do conhecimento, componente, ID da capacidade, caminho/trecho do código, `source.reviewedOn`, última alteração Git e ação recomendada:

- `review-required` (**aviso**, sem bloquear): código alterado **depois do dia** da revisão ou alteração local não commitada, mesmo que o trecho citado ainda exista. Revisar manualmente comportamento e testes derivados antes de alterar a data.
- `missing-evidence` (**erro bloqueante**): arquivo ausente/ilegível ou trecho literal removido; o validador `validateSemanticOverlay` continua reprovando `semantic:check` e impede publicar relatório tido como válido. Corrigir a evidência ou revisar explicitamente a classificação da capacidade, nunca de forma automática.
- `history-unavailable` (**incerteza**, sem bloquear): evidência presente, porém sem histórico Git (por exemplo, checkout sem repositório). Não significa `current`; repetir a verificação com histórico.
- `current`: evidência literal presente e nenhuma mudança posterior detectada; **não** certifica comportamento em execução.

`source.reviewedOn` é uma **data de revisão da documentação oficial**, reutilizada como referência conservadora de precisão diária para mudanças no código; **não** comprova revisão da implementação. Mudanças no mesmo dia não podem ser ordenadas pela data. A detecção por arquivo pode produzir falsos positivos por alterações não relacionadas e não prova comportamento. Alertas de revisão não mudam estados nem falham o comando. Evidência textual ausente continua provocando falha no validador já existente. Capacidades `documented-not-implemented` e `runtime-review-required` têm evidências intencionalmente vazias e **não** são classificadas como arquivos ausentes.

Os testes `node --test tests/semantic-freshness-t27.test.mjs` incluem mudança commitada preservando o trecho, exclusão de arquivo/trecho, evidência ainda válida, alteração local e histórico indisponível. Em checkout completo, executar `npm run semantic:check && npm run semantic:report && npm run test:offline`; o job `offline-policy` da CI repete as verificações. Registrar os resultados reais na PR; nem relatório nem teste estático equivalem a E2E, admissão ou autorização Pi.

## T28 — Controle de qualidade semântica no CI e preservação de evidências (27/10/2026)

O [workflow de qualidade](../.github/workflows/quality.yml) existente executa as verificações no job **Source, docs and offline tests**, em PRs e pushes para `main`. São os **mesmos comandos** da T26/T27, sem workflow paralelo:

```bash
npm run semantic:check
npm run semantic:report
node scripts/semantic-ci-summary.mjs
npm run docs:check
npm run test:offline
```

`semantic:check` continua **bloqueante** para registro incompleto, arquivo de implementação ausente ou trecho literal removido. `semantic:report` é executado **mesmo após falha do check** e preserva o caminho único `reports/composition-analysis/semantic-knowledge.json`. Quando há erros, o relatório recebe `validation: { status: "failed", errors: [...] }` e o comando mantém retorno diferente de zero: **trata-se de diagnóstico, não de relatório validado**. Quando válido, o formato original é preservado. Os estados `review-required` (código alterado após revisão) e `history-unavailable` continuam avisos, sem autorizar implementações ou admissões.

Em cada execução, o CI publica o artefato **`semantic-knowledge-report`** (JSON, `semantic-check.log` e `semantic-report.log`) por 14 dias, além de um resumo do job com contagens, falhas e diagnósticos rastreáveis overlay → componente/capacidade → evidência no código e ação. O Bash utiliza `pipefail` para impedir que o `tee` oculte falhas. Verificação documental, testes offline, checks de implementação, build, admissão e E2E manual continuam independentes.

Para reproduzir os cenários execute `node --test tests/semantic-ci-t28.test.mjs`: casos **válidos**, **incompletos**, **alterados com evidência presente** e **sem evidência** são avaliados pelos comandos reais do analisador. `npm run test:offline` inclui essa regressão. Use checkout com histórico completo (`fetch-depth: 0`) para avaliar datas. Não atualize datas de revisão, schemas, permissões Pi ou estados de admissão automaticamente para eliminar avisos.

## Verificação operacional vigente — 29/10/2026

Este checklist continua sendo o **formato de curadoria de cada overlay**, não um novo fluxo de aprovação. O CLI semântico na `main` já contém a priorização T25 (`enrichmentPriorities`), cobertura T26 (`semanticCoverage`), desatualização T27 (`semanticFreshness`), aderência Zod/Pi T31 (`semanticConformance`) e receitas de testes curadas (`semanticTestAutomation`). Consulte resultados atuais; as contagens históricas T19 acima são uma linha de base datada, não meta ou aprovação vigente.

Após revisar um overlay, compare *adaptador local e contrato efetivo*, o encadeamento exato `path`/`contains` de cada capacidade implementada e os três estados distintos. `source.reviewedOn` registra revisão da documentação oficial: **não altere a data apenas para ocultar alerta de desatualização**. Revise `contractBindings` somente para props/eventos existentes e `decision` para lacunas candidatas; documentação não libera APIs novas. Uma receita `derivedTestCases[].automation` registrada não equivale à execução Playwright; testes parciais não comprovam acessibilidade completa nem fidelidade visual.

Execute `npm run semantic:check`, `npm run semantic:report`, `npm run docs:check` e `npm run test:offline`, registrando os *resultados reais* e SHA no PR. O comando de relatório produz `semantic-knowledge.json` (principal e ignorado pelo Git), `semantic-capability-gaps.json` e `semantic-composition-proposals.json` no diretório `reports/composition-analysis/`. Um relatório com `validation.status: "failed"` é inválido. A CI existente bloqueia evidências semânticas incorretas; comportamento em navegador e disponibilização de contrato estável obedecem aos controles independentes. Consulte o [processo semântico](semantic-enrichment-workflow.pt-BR.md) e a [descoberta semântica somente leitura](semantic-catalog-discovery.pt-BR.md).
