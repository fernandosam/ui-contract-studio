[English](flexible-interfaces-t17-t28.md) | [Português](flexible-interfaces-t17-t28.pt-BR.md)

# T17–T28 — Interfaces flexíveis orientadas por requisitos

Revisão inicial: 2026-10-27.

## T17 — Diagnóstico de limitações

A base vigente permite compor campos, layouts, tabelas, botões e diálogos utilizando contratos aprovados. Limitações observáveis no código: `Input.checks` declara restrições mas não executa validações de negócio; `AlertDialog` emite confirmação local e não salva dados; ações de formulário demonstrativas não fornecem backend. Não ampliar contratos por simples documentação.

A matriz versionada em `tests/fixtures/requirements-scenarios.json` possui doze situações: oito variáveis de cadastro demonstrativo que devem gerar specs estáticas válidas e quatro situações bloqueadas (persistência não especificada, backend não autorizado, validação de negócio e ausência de campos). O relatório executável `npm run requirements:audit` calcula as contagens a partir das implementações, e não equivale a E2E.

## Entrega 1 — T18/T19

`src/ui-requirements/composition-rules.json` referencia IDs de capacidade revisados, sem criar novo estado de implementação; `capabilities.ts` fornece busca no subconjunto piloto de overlays AlertDialog, Input, Select, Button e DataTable. Continua valendo a fonte de verdade dos contratos Zod e o lock. A descoberta semântica é consultiva.

## Entrega 2 — T20/T21/T22

`flows/registration.json` declara perguntas, padrões, condições e escolhas explícitas. `schema.ts` valida seu formato; `engine.ts` verifica respostas, visibilidade e origem (`explicit`/`default`). Persistência exige resposta explícita. `/?screen=criador-interfaces` oferece assistente visual. O piloto só reconhece cadastro.

## Entrega 3 — T23/T24/T25/T26

`planner.ts` reutiliza Card, Stack/Grid, Input, Button/AlertDialog; `generator.ts` monta árvore JSON sem JSX arbitrário, URLs livres ou efeitos remotos. `behavior.ts` oferece predicados/validação de valores tipados, mas **não os instala automaticamente no runtime Pi**. A variação de campos e layout não exige schema novo. Confirmação é independente do envio: prévia local, não confirmação integrada a gravação. `npm run requirements:preview -- --file=reports/requirements/answers.json` recebe `{"intent":"cadastro","answers":{"persistence":"local-demo"}}` e exibe relatório e spec. Não grava em `src/ui-screens` sem revisão.

## Entrega 4 — T27/T28

`verify.ts` invoca validação Zod do catálogo, invariantes de grafo e comparação estática da presença de campos e confirmação. `npm run requirements:test` e `npm run requirements:audit` cobrem os 12 cenários. Regras de validação nativa são **pendentes de verificação em navegador**, não homologadas. E2E completo permanece manual na main.

## Lacunas e critérios de evolução

1. Não declarar validação de negócio ou tratamento de erros como implementado: são contratos/comportamentos ausentes, que exigem tarefa separada e revisão.
2. Não declarar persistência: backend, autenticação, autorização e erro de servidor precisam de contratos explícitos.
3. Ampliar descoberta de cadastro para outros tipos de tela somente após casos representativos e testes independentes.
4. Para testes de comportamento real, acessibilidade e responsividade, executar navegador em ambiente conectado e registrar evidência.
5. As oito specs aceitas são **demonstrações estáticas**, não cadastros funcionais ponta a ponta.

## Verificações recomendadas

```bash
npm run requirements:test
npm run requirements:audit
npm run semantic:check
npm run contracts:check
npm run validate
npm run build
```

## Continuação — T34: rastreabilidade de requisitos (2026-10-27)

`src/ui-requirements/traceability.ts` verifica de forma independente correspondências entre respostas, campos/seleção de componentes e árvores JSON de cadastro, login demonstrativo, busca, listagem e dashboard. Cada requisito possui ID, origem (`explicit`/`default`/`derived`), IDs dos nós relacionados, estado e evidências exclusivamente estáticas.

Estados: `covered-static` significa que propriedades e composição verificadas estão presentes; `runtime-review-required` registra comportamento ainda não comprovado pelo relatório; `blocked` marca inconsistência ou capacidade indisponível. O relatório nunca indica testes de navegador como executados sem evidência separada.

O dashboard pergunta por densidade de indicadores apenas para KPIs, não para a visualização de gráficos. O gerador não amplia contratos nem ações Pi. O assistente exibe o relatório em seção expansível após gerar a prévia.

```bash
npm run requirements:test
npm run requirements:audit
npm run requirements:patterns:audit
```

A CLI produz somente informações estáticas e permanece independente dos relatórios Playwright, que devem ser consultados com execução e commit correspondentes. A implementação não conclui autenticação, persistência, validação de negócio ou certificação acessível completa.

## T35 — Candidato declarativo de formulário (revisão: 2026-10-27)

Como próximo estágio, `DeclarativeFormFlow` é uma **proposta React/Zod independente, ainda não registrada nos contratos Pi**. O candidato aceita campos tipados e únicos, `required`, `minLength`, `maxLength`, validação em envio ou saída de campo, layout simples ou em duas colunas e confirmação local opcional. Não aceita URLs, callbacks, JSX arbitrário ou operações de persistência.

O assistente de cadastro utiliza a proposta como prévia executável. A spec JSON do Pi continua usando apenas os contratos aprovados; a prévia **não equivale a uma admissão experimental ou estável**. O candidato não envia dados e emite apenas uma conclusão local; o fluxo demonstrativo não tem backend.

Testes de contrato, estados e navegador devem passar antes da revisão humana de API e da entrada eventual no Admission Engine. Somente um passo independente pode ampliar o manifesto Pi. A T35 ainda requer essa admissão e avaliação acessível independente.

Critério futuro: pelo menos três cenários reutilizando o mesmo componente, contrato Zod estrito, Playwright desktop/mobile, verificação de foco e teclado, e ausência de chamadas remotas.

## T35 — Admissão experimental explícita (2026-10-27)

A segunda etapa registra `DeclarativeFormFlow` **somente no canal experimental do Pi**, mediante receita revisável, schema Zod estrito e controle de origem no Admission Engine. O canal estável permanece sem o contrato. A implementação continua exclusivamente local, sem endpoints, ações remotas, envio ou persistência; seu evento `complete` não é exposto como ação Pi.

A demonstração no assistente passa a usar `SpecScreen channel="experimental"`, exercitando o renderizador Pi real. Há um exemplo serializado em `pi-catalog/experimental-examples/DeclarativeFormFlow.json` e verificações que rejeitam atributos arbitrários e recusam a spec no canal estável.

**Ainda não homologado:** `validation.e2e=pending`, sem elegibilidade à promoção automática. Evidências de navegador local e auditoria de acessibilidade não equivalem à certificação independente exigida pelo workflow manual do Admission Engine. Nenhuma permissão de backend é concedida.
