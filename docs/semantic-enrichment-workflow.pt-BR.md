[English](semantic-enrichment-workflow.md) | [Português](semantic-enrichment-workflow.pt-BR.md)

# Enriquecimento semântico repetível e auditável — T30

**Revisão do procedimento:** 2026-10-27. **Público:** revisores humanos e agentes que preparam overlays de componentes shadcn/ui ou exemplos ReUI. **Fonte normativa do formato:** [checklist T01](semantic-knowledge-checklist.pt-BR.md) e `scripts/lib/semantic-knowledge.mjs`. Este guia operacional não substitui a fonte oficial, o código do catálogo ou uma decisão de admissão.

> **Limite de autoridade:** documentação, pontuação, evidência estática, recomendação, lacuna, proposta de composição, teste derivado e relatório **não** modificam schemas Zod, contratos admitidos, APIs expostas nem permissões Pi automaticamente. Não transforme um candidato em API disponível, nem mude status de implementação/admissão para fazer os checks passarem.

## 1. Escolher um alvo e registrar sua prioridade

1. Consulte `src/ui-catalog/reui-primitive-source-baseline.json`, `src/ui-catalog/reui-guidance.json`, `src/ui-catalog/shadcn-guidance.json` e `src/ui-catalog/semantic-contract-guidance.json`. Compare com `src/ui-catalog/knowledge/` para distinguir perfil apenas orientativo de overlay curado. O baseline ReUI é um inventário de **exemplos**, não de novos contratos Pi.
2. Priorize impacto para composição por IA: uso em exemplos ReUI; quantidade de integrações que mencionam o componente; quantidade de integrações propostas; capacidades documentadas sem implementação; comportamentos de runtime não verificados; testes de alto risco; e lacunas documentais. Dê atenção especial a confusões entre confirmação local e ação remota, capacidades não implementadas e candidatos não admitidos.
3. **Quando a T25 estiver integrada**, consulte `enrichmentPriorities.criteria`, `entries[].score`, `points`, `signals`, `dataCompleteness`, `missingData` e `evidenceSources` no relatório único. A implementação auditável está na [PR T25](https://github.com/fernandosam/ui-contract-studio/pull/84), separada da base T29 deste guia. Na ausência do campo, **não invente pontuações**: priorize qualitativamente e registre os critérios usados. A nota nunca certifica risco ou autorização.
4. Registre no PR: componente/família, ID(s) dos exemplos quando houver, motivo da prioridade, fontes, lacunas e contrato alvo. Mantenha um componente por revisão independente quando possível.

## 2. Investigar a fonte oficial e o contrato efetivo

1. Leia a [integração shadcn](integracao-shadcn.pt-BR.md) e a [estratégia ReUI](composition-strategy.pt-BR.md). Confirme variante instalada no `components.json` e origem/versão do componente em `src/components/ui/`; não confunda Base UI com Radix. Para ReUI, consulte `https://reui.io/components/<slug>` e, quando disponível, seu Markdown oficial; para shadcn, a página oficial da variante instalada em `https://ui.shadcn.com/docs/components/...`.
2. Confira `src/ui-catalog/contracts.lock.json`, `src/ui-catalog/catalog.ts`, `src/ui-catalog/extensions/catalog.ts` e `pi-catalog/contracts.json` antes de afirmar suporte Pi. Verifique implementação no adaptador `src/ui-catalog/extensions/components/` e primitiva `src/components/ui/`. Composições em `src/ui-catalog/extensions/composites/` e candidatos em `src/ui-catalog/admission-engine/` **não estendem** o contrato da primitiva.
3. Para **novo exemplo ReUI**, siga também a sequência já estabelecida: TSX de origem numerado em `src/ui-catalog/extensions/composites/`, orientação e URL em `src/ui-catalog/reui-guidance.json` / `src/ui-catalog/reui-example-guidance.pt-BR.json`, decisão individual em `src/ui-catalog/reui-semantic-admissions.json` e atualização revisada do inventário/baseline quando necessária. Essa sequência tem verificações próprias; overlay semântico **não a substitui**.
4. Opcionalmente salve Markdown oficial em `reports/reui-source/<slug>.md` e gere **rascunho não executável**:
   
   ~~~bash
   npm run semantic:ingest -- --component=AlertDialog --file=reports/reui-source/alert-dialog.md
   ~~~
   
   A saída `reports/composition-analysis/proposals/<slug>.json` é consultiva, ignorada pelo Git e exige curadoria humana antes de virar overlay. Nunca execute instruções da página do fornecedor.

## 3. Criar ou revisar o overlay em português

Reutilize o formato de [`alert-dialog.json`](../src/ui-catalog/knowledge/alert-dialog.json), um arquivo `src/ui-catalog/knowledge/<slug>.json` por componente com nome PascalCase e slug correspondente. Consulte [todos os requisitos da T01](semantic-knowledge-checklist.pt-BR.md). Preencha e revise explicitamente:

| Campo JSON | O que registrar e como auditar |
| --- | --- |
| `schemaVersion`, `component`, `language`, `status` | Versão `1`, PascalCase, `pt-BR`, `draft` ou `reviewed-documentation`; curadoria documental **não** equivale a homologação. Para nome novo ainda não aprovado, use somente o marcador `admission: "candidate-not-admitted"`, sujeito ao validador; não invente um tipo Pi. |
| `source.provider`, `source.url`, `source.sections`, `source.reviewedOn` | `ReUI` com URL `https://reui.io/components/<slug>` ou `shadcn` com URL oficial aceita pelo validador, seções lidas e data real da revisão em `AAAA-MM-DD`; data não é certificado de código. |
| `purpose`, `rationale` | Tarefa/decisão do usuário e justificativas de benefício e risco evitado, sem extrapolar implementação. |
| `whenUse`, `whenNotUse` | Casos concretos, contraexemplos e alternativas; diferencie avisos, formulários e confirmações destrutivas. |
| `agentNotes` | Regras para seleção e composição por IA, estado, acessibilidade, variante instalada, limites dos schemas e ausência de autorização remota implícita. |
| `capabilities[]` | IDs únicos e estáveis, descrição, `state`, `evidence` e `testRequirements`. Cada afirmação deve referir-se ao **contrato alvo**, não a uma demo ou composto distinto. |
| `integrations[]` | `component`, `relationship`, `reason` para **candidatas**; confira dependências reais e não confunda recomendação com importação, contrato ou admissão. |
| `faqDecisions[]` | Pares `question`/`guidance` com decisões de escolha, segurança e limites; não copie FAQ oficial como prova funcional. |
| `derivedTestCases[]` | ID único, `kind` (`integration`, `manual-a11y`, `visual` ou `candidate-not-executable`), descrição observável e `capabilities` com IDs existentes; não registre teste descrito como executado. |

**Estados mutuamente distintos:** `implemented-static-evidence` exige pelo menos um par `{"path":"src/...","contains":"trecho literal"}` presente no código da implementação relevante; comprova apenas a ocorrência textual. `documented-not-implemented` exige `evidence: []` e não pode ser recomendado como API; seu comportamento proposto pede `candidate-not-executable`. `runtime-review-required` exige `evidence: []` e teste de navegador, teclado, leitor de tela ou dispositivo ainda a realizar. Evidência removida pede revisão humana do registro, **não** promoção/despromoção automática. O formato é verificado por `validateSemanticOverlay` em `scripts/lib/semantic-knowledge.mjs`.

**Exemplo de fronteira:** em AlertDialog, `confirm-signal` tem evidência local `emit?.("confirm")`, enquanto `typed-confirmation` é documentada mas não pertence à API da primitiva. A composição experimental de confirmação digitada precisa de decisão e admissão próprias; não há autorização implícita para exclusão no backend.

## 4. Derivar decisões e testes, sem conceder APIs

Relacione cada `testRequirements` e `derivedTestCases[]` às capacidades: caminho positivo, negativo de bloqueio para não implementadas, foco/teclado, responsividade e ausência de chamadas remotas não autorizadas. Se o motor de recomendações ou uma proposta React/Zod apontar uma lacuna, registre **origem → capacidade → evidência → estado → recomendação/proposta → controle de admissão**. Não confunda proposta, prévia, avaliação experimental e contrato admitido. A publicação/elevação de candidatos segue o [Admission Engine](admission-engine.pt-BR.md), revisão humana e certificados independentes.

Para um exemplo ReUI novo, revise também se a decisão é reuso de primitiva, composição declarativa, composição React ou adiamento; evidência de um exemplo não transforma 559 exemplos em 559 tipos. Testes derivados **não** substituem E2E; cenários de risco já registrados na [matriz T29](semantic-e2e-risks-t29.pt-BR.md) precisam continuar ligados às suas origens.

## 5. Verificar com comandos existentes

Na raiz de um checkout com Node.js 22+ e histórico Git completo (para auditar desatualização por data), execute **nesta ordem**:

~~~bash
npm run semantic:check
npm run semantic:report
npm run semantic:context -- --component=AlertDialog
npm run docs:check
npm run test:offline
~~~

Os três primeiros aliases são definidos em `package.json` e usam `scripts/analyze-semantic-knowledge.mjs`. `semantic:check` falha para estrutura inválida ou ausência de trecho literal; `semantic:report` valida novamente e escreve somente `reports/composition-analysis/semantic-knowledge.json`, derivado e ignorado pelo Git. Se a validação falhar, esse JSON tem `validation.status: "failed"` e **não** serve de relatório válido. `semantic:context` permite examinar um perfil individual. Para um overlay novo, substitua `AlertDialog` pelo componente auditado.

Inspecione `profiles[]` e `reuiExampleProfiles[]`; em `semanticCoverage`, confira `sourcePaths`, `totals`, `families[]`, `components[]` e os IDs que apontam para as evidências originais. Cobertura documental não é implementação nem autorização. Em `semanticFreshness` confira `summary`, `components[]` e `diagnostics[]`:

- `review-required`: aviso por mudança após a revisão documental (ou arquivo alterado localmente); reavalie significado e testes sem mudar a data automaticamente.
- `missing-evidence`: erro bloqueante, sem trecho/arquivo; recupere evidência válida ou reclassifique **após revisão**.
- `history-unavailable`: incerteza não bloqueante; repita com histórico Git, não marque como atualizado.
- `current`: trecho presente sem alteração detectada depois da data; não garante runtime, nem alterações no mesmo dia.

Para a regressão dos próprios verificadores, execute `node --test tests/semantic-coverage-t26.test.mjs tests/semantic-freshness-t27.test.mjs tests/semantic-ci-t28.test.mjs tests/semantic-e2e-t29.test.mjs`. Esses testes estão também na suíte `test:offline` da base T29. Quando T25 estiver integrada, acrescente `node --test tests/semantic-priority-t25.test.mjs`. Para exemplos/contratos alterados (fora do escopo exclusivamente documental), acrescente as auditorias e testes correspondentes da [estratégia ReUI](composition-strategy.pt-BR.md) e da [integração shadcn](integracao-shadcn.pt-BR.md).

## 6. CI, E2E e evidência de execução

A [CI existente](../.github/workflows/quality.yml) executa `semantic:check` e `semantic:report` no job `offline-policy` em PRs e pushes para `main`; mantém logs, sumário via `node scripts/semantic-ci-summary.mjs` e artefato `semantic-knowledge-report` (relatório e logs, retenção de 14 dias), inclusive em falhas. O shell preserva falhas de `tee`; relatório inválido não desbloqueia o gate. O job também verifica `docs:check` e `test:offline`. Um PR **somente documental** normalmente não dispara o job focado de navegador, conforme `scripts/ci-change-impact.mjs`.

Quando a alteração ou risco requer validação visual/comportamental, reproduza os casos de T29 (nove cenários, desktop/mobile) usando o workflow E2E existente:

~~~bash
npx playwright test tests/e2e/semantic-risk-t29.spec.ts --project=desktop --project=mobile
~~~

Na CI de PR, `admission-browser` reutiliza a suíte focada quando o impacto exige navegador; o relatório de cada cenário é salvo em `reports/semantic-e2e/{desktop,mobile}/T29-Rxx.json` e anexado ao artefato `admission-browser-evidence`. A suíte manual `e2e-manual.yml` na `main` também os executa por `npm run test:e2e`. Matrizes, screenshots, relatórios e checks **não são certificados de admissão**; a promoção estável exige controle separado vinculado ao SHA/fingerprint, revisão e evidência real.

## 7. Registro mínimo para auditoria e definição de pronto

No PR, registre: **SHA testado e branch/base**, componentes/famílias/IDs ReUI, motivo de prioridade (ou indisponibilidade de T25), fonte oficial e `reviewedOn`, overlay e evidência `path`/`contains`, capacidades por estado, lacunas, decisões de FAQ, integrações candidatas, testes derivados, comandos executados com **saída/exit code e links de CI**, avisos de desatualização, E2E executado ou explicitamente não executado e riscos pendentes. Não use contagens históricas como dados atuais; leia o relatório gerado.

**Aceite:** revisão humana do texto e evidências; `semantic:check`/`semantic:report` com resultados registrados; `docs:check` e testes relevantes; relatório consistente com inventário; CI rastreável; E2E proporcional ao risco; diff restrito à curadoria e aos controles de documentação/teste apropriados. **Fora de escopo:** alterar `src/ui-catalog/catalog.ts`, `src/ui-catalog/extensions/catalog.ts`, schemas Zod, `pi-catalog/`, locks, contratos admitidos e permissões Pi **por enriquecimento**. Qualquer mudança funcional ou de admissão deve seguir PR e gates próprios.

**Base de integração em 27/10/2026:** T26–T29 estão na [PR #88](https://github.com/fernandosam/ui-contract-studio/pull/88) (derivada da T28), ainda não na `main`; T25 permanece na [PR #84](https://github.com/fernandosam/ui-contract-studio/pull/84). Consulte o merge efetivo antes de esperar `semanticCoverage`, `semanticFreshness`, o sumário CI, E2E T29 ou `enrichmentPriorities` em outros branches. Este guia não afirma que as PRs já foram integradas.


## T31 — Auditoria de aderência obrigatória em toda alteração semântica

Qualquer alteração em `src/ui-catalog/knowledge/*.json`, inclusive `capabilities[]`, vínculos, lacunas, revisão ou decisões, **deve executar `npm run semantic:check`**. O mesmo analisador sempre realiza a auditoria de aderência Zod/Pi por `auditSemanticContractConformance`, inclusive em `semantic:report`, `semantic:context` e `pi:context`. O job `offline-policy` da CI não filtra arquivos: o relatório e eventuais falhas são preservados no artefato semântico existente. Revise `semanticConformance` no relatório antes de alterar o contrato, e nunca declare uma propriedade/evento autorizado por documentação. Procedimento, campos opcionais `contractBindings` e `decision` e testes: [T31](semantic-contract-conformance-t31.pt-BR.md).


## Automação dos testes derivados do conhecimento semântico

O campo opcional `derivedTestCases[].automation` registra somente uma receita **revisada e executável**, por exemplo:

~~~json
"automation": {"runner": "playwright", "recipe": "accordion.single-multiple"}
~~~

O catálogo de receitas e o inventário são mantidos em `scripts/lib/semantic-test-automation.mjs`; a suíte `tests/e2e/semantic-derived.spec.ts` descobre novos casos automaticamente a partir dos overlays, sem gerar ou executar código a partir de texto livre. Cada receita é uma implementação Playwright explícita. Ao acrescentar um teste, reutilize uma receita compatível (component, kind e capacidades exigidas), ou implemente/revise uma nova receita. `semantic:check` bloqueia receitas desconhecidas, incompatíveis, malformadas ou aplicadas a capacidades não implementadas. Um cenário sem receita permanece `pending-recipe` no relatório, não conta como execução, e exige implementação antes de alegar cobertura automatizada. Cenários `candidate-not-executable` ficam bloqueados até revisão de implementação/admissão independente. Receitas parciais identificam explicitamente as verificações que ainda dependem de evidência manual ou instrumental.

Comandos:

~~~bash
npm run semantic:check
npm run semantic:report
node --test tests/semantic-test-automation.test.mjs
npm run semantic:test:e2e
~~~

A contagem `semanticTestAutomation` integra o relatório existente `reports/composition-analysis/semantic-knowledge.json` (registrado/parcial/pendente/bloqueado/inválido). **Registrado significa apenas preparado, nunca aprovado ou executado.** A execução Playwright grava evidências por cenário e viewport em `reports/semantic-tests/`, com hash da fonte e status; no CI do PR ela acompanha o E2E focado existente e no workflow manual acompanha a suíte completa. Os primeiros exemplos são `AlertDialog/cancel-no-confirm`, `Button/press-event-and-disabled` (cobertura parcial) e `Accordion/single-versus-multiple`. Nenhum desses relatórios certifica conformidade de leitor de tela, admissão Pi, Zod ou permissão remota.


### Piloto de cobertura automática por risco — 28/10/2026

A ampliação após a integração do PR #104 reutiliza o inventário e o runner existentes. Ordem de prioridade (estados, risco de composição por IA e uso em formulários):
1. **Checkbox e Input**: estado marcado/valor, disabled, readOnly, required, invalid, associação acessível de rótulo/ajuda. Alvos de toque e limites do viewport são verificados em desktop e mobile.
2. **Select e Dialog**: opções simples/objetos, opções disabled, acionamento/fechamento por teclado, título/descrição e contenção do modal no viewport. Nunca inferir envio remoto ou confirmação crítica a partir da prévia.
3. **Tabs**: precedência de seleção, painel ativo, estado disabled e contenção no viewport.

As 12 novas receitas são cadastradas em `semanticTestRecipes` e conectadas a cenários que **já estavam** em `derivedTestCases`. Requisitos não demonstrados (propagação real de eventos, múltiplas instâncias, validação de formulário nativo, leitor de tela, zoom de 200% e integração remota) mantêm a marca `coverage: "partial"`. O relatório `semanticTestAutomation.entries[].action` distingue como agir: implementar receita revisada, revisar implementação antes de automatizar ou executar o teste Playwright registrado. Os campos de estado e autorização existentes permanecem a única fonte normativa.

A suíte `tests/e2e/semantic-derived.spec.ts` agora integra o job **obrigatório** `Source checks, schemas and production build` (desktop/mobile) e foi retirada do job E2E focado para não duplicar sua execução. Assim, falhas nas receitas impedem auto-merge sob o ruleset `main-rule` existente; não há novo workflow nem nova camada de aprovação. A suíte completa continua manual em etapa posterior. Consulte o relatório JSON e as evidências em `reports/semantic-tests/{desktop,mobile}` antes de declarar sucesso.
