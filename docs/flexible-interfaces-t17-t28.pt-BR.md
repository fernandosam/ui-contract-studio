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

## T35 — Protocolo independente de evidências para DeclarativeFormFlow (2026-10-27)

O novo protocolo `declarative-form-desktop-mobile` cria cinco provas por viewport (desktop + mobile; dez execuções), com captura PNG e resultado JSON em `reports/composition-validation/admission/form-declarative/`, e associação obrigatória a `sourceDigest`, nome do protocolo e SHA exato de `main`.

Casos: (1) campos obrigatórios e erro de e-mail com foco/ARIA, (2) confirmação, Escape e cancelamento sem conclusão, (3) Tab/Enter, rótulos e retorno ao campo inválido, (4) duas colunas desktop/uma mobile com campos opcionais, (5) conclusão local com validação explicitamente desabilitada. Os testes rejeitam qualquer `fetch`/`xhr` após o início das interações e verificam que nenhum registro foi salvo.

A política `e2eEligible` **não atribui** `status=passed`, certificados, eventos ou ações ao Pi; o contrato continua experimental e o catálogo estável não o aceita. A prévia e o E2E por PR não bastam para a promoção: é necessário executar manualmente o workflow `E2E manual (main)` depois da revisão do PR. Esse workflow verifica a versão da main, reinicia provas antigas, executa os casos reais, exige os resumos e screenshots compatíveis e certifica no job separado. Acessibilidade por leitor de tela e revisão manual de segurança permanecem explicitamente pendentes; testes automatizados de teclado/ARIA não equivalem a uma auditoria humana completa.

Não interpretar evidência sintética de testes de unidade como prova de navegador; nunca forjar ou pré-gravar `certifications.json`. Mudança de digest, protocolo ou revisão invalida a certificação anterior.

## T32 — Gateway de submissão autorizada (revisado em 2026-10-27)

\`createSubmissionGateway\` é uma **fronteira exclusivamente de servidor confiável**: o hospedeiro precisa injetar serviços autorizados e obter usuário, tenant, permissões e verificação CSRF de sessão segura. \`defaultSubmissionGateway\` não aceita serviço algum. \`createInMemoryDemoService\` é uma fixture de teste isolada que aceita somente nome/e-mail, não persistência de produção.

O gateway verifica entradas, evita duplicação concorrente e reutilização conflitante de chaves de idempotência, usa timeout com \`AbortSignal\` e devolve erros sanitizados. **Idempotência em memória e cancelamento não oferecem garantia transacional durável.** Produção exige backend aprovado à parte, idempotência persistente, autenticação, logs e revisão de segurança.

Nenhuma URL/SQL/JS, permissão Pi, rota de browser ou operação remota foi acrescentada. Os testes cobrem sucesso, conflitos, isolamento, timeout, tentativa posterior e falhas. E2E de persistência real permanece fora do escopo sem serviço autorizado.

## T33 — Reutilização de decisões da solicitação (2026-10-27)

O assistente aceita uma descrição curta, reconhece um padrão não ambíguo e sugere apenas opções já declaradas em \`pattern-flows.json\`. Prioridade: **resposta explícita > inferência conservadora > padrão documental**. Relatórios registram origem \`explicit\`, \`inferred\` ou \`default\`; intenção ambígua exige escolha manual. Perguntas condicionais ocultas não entram na especificação. \`validateFlow\` rejeita duplicatas e dependências inválidas.

Nenhum handler, API, autenticação remota ou componente Pi adicional é autorizado. Testes de integração e Playwright desktop/mobile cobrem as escolhas.

## T34 — Análise de impacto e métricas estáticas reproduzíveis (2026-10-27)

\`npm run requirements:impact -- --changed=src/ui-catalog/knowledge/input.json\` gera matriz de impacto vinculada à revisão Git para cadastro, login, busca, listas e dashboards, com verificações de migração sugeridas para contratos, padrões e documentos semânticos referenciados. Caminhos desconhecidos são informados **explicitamente**, nunca tratados automaticamente como seguros. O resultado é consultivo; revisão de API, aprovação e testes de navegador independentes continuam necessários.

A auditoria mede a aprovação inicial de 12 variantes de cadastro e 12 variantes de padrões: bloqueios esperados são separados, tipos novos de contrato não são inferidos, e cada spec estática aceita recebe uma impressão SHA-256 determinística. A revisão Git aparece no relatório e as evidências em execução permanecem \`not-imported\`. São métricas estáticas, **não certificação funcional nem prova de teste visual real**. Verificar com \`npm run requirements:impact\` e \`npx tsx --test tests/requirements-impact.integration.test.ts\`.

## T33 — Três decisões por padrão (2026-10-27)

Cada fluxo declara pelo menos três decisões de interface: o login pode mostrar ajuda, a listagem exibir um resumo de dados fictícios e o dashboard uma nota sobre os valores. A busca já possuía três perguntas. Todas as variações reutilizam contratos Text/Card/Table/Metric/Grid aprovados. As respostas mantêm proveniência e são verificadas na árvore gerada. As novas decisões visuais não habilitam autenticação, busca remota, mutações ou persistência.

## T34 — Evidências de navegador por requisito, vinculadas à spec e ao commit (2026-10-27)

O job de revisão em navegador executa oito variantes representativas em desktop e mobile, verificando campos, rótulos, elementos opcionais e linhas visíveis. Cada execução Playwright real gera PNG e JSON com SHA de origem, ID da execução GitHub, impressão digital da spec Pi gerada, caso, IDs dos requisitos efetivamente verificados e projeto do navegador. O comando \`npm run requirements:browser:report\` rejeita evidências ausentes, incorretas ou obsoletas antes de gravar \`reports/requirements-browser/summary.json\` no artefato do CI.

Somente as **afirmações específicas de renderização** recebem estado \`tested-render\`; os demais requisitos continuam \`covered-static\` ou \`runtime-review-required\`. Isso não certifica filtro funcional, autenticação, CRUD, envio de formulário, leitor de tela ou fidelidade visual. SHA/spec divergente, execução reprovada/repetida, captura ausente, requisito não declarado e navegador incorreto bloqueiam o relatório. Fixtures sintéticas de teste da verificação não são provas de navegador.

Evidência de PR é auxiliar à revisão, não certificação independente de produção. Nenhum contrato ou permissão Pi é alterado.

## T32 — Fronteira HTTP demonstrativa e controlada (2026-10-27)

\`createControlledDemoHttpHandler\` é somente um **RequestListener Node**, sem iniciar servidor. Um hospedeiro confiável deve injetar autenticação, IDs de serviços permitidos, usuário/tenant e token CSRF da sessão e disponibilizá-lo **apenas em loopback** durante testes. O endpoint de teste fixo \`POST /__demo__/submit\` exige Origin exata, Bearer, CSRF, JSON e ID allowlisted; tamanho é limitado e erros são sanitizados. A identidade dos testes é efêmera; os registros são mantidos **somente em memória no servidor**. Origem, sessão, serviço e campos desconhecidos são bloqueados; duplicação e timeout são testados separadamente.

O E2E comprova que o formulário Pi **não envia dados automaticamente**, mesmo após validação/confirmação, enquanto uma requisição HTTP de teste **explicitamente separada** salva um registro fictício temporário. Não existe integração direta entre esses fluxos, identidade de produção, banco durável, implantação, URL arbitrária, nova ação Pi ou expansão de contrato Zod. Um backend de produção depende de identidade, serviço, armazenamento e política de admissão revisados independentemente.
