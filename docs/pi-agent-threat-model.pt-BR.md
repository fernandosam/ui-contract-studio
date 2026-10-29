[English](pi-agent-threat-model.md) | [Português](pi-agent-threat-model.pt-BR.md)

# E09 — Modelo de ameaças do Pi Agent

**Escopo:** análise estática de entradas, saídas e execução do Pi Agent no UI Contract Studio.  
**Base revisada:** `main`, 29/10/2026 (arquivos citados abaixo; conferir diff antes da aprovação).  
**Método:** fluxos de dados, limites de confiança, STRIDE e prioridade por impacto/probabilidade.  
**Status:** avaliação documental. Não equivale a pentest, validação dinâmica, certificação do provedor de IA ou comprovação da configuração do ambiente do operador.

## 1. Objetivo e ativos

O Pi pode ler requisitos, orientações e exemplos, sugerir componentes e gerar specs JSON para uso no catálogo fechado. Também existe o **Pi CLI como agente de desenvolvimento**, que pode receber ferramentas de edição/terminal; não se deve confundir esse agente com o **avaliador controlado** que invoca `pi --no-tools`, nem com o **runtime React**, que renderiza JSON após validação.

Ativos que precisam de proteção:

- **Integridade:** schemas Zod, lock/fingerprints, políticas de admissão, registries, ações, workflows, telas e evidências E2E.
- **Confidencialidade:** variáveis de ambiente, chaves de provedor, sessões do operador, prompts, dados de usuário e artefatos de avaliação.
- **Disponibilidade:** runner de CI, processo Pi, parser, validador e interface no navegador.
- **Autorização:** separação stable/experimental, revisão independente, credenciais do GitHub e escopo de fontes remotas.

**Adversários e erros considerados:** autor de requisito não confiável, documento externo comprometido, exemplo ReUI malicioso, saída não confiável do modelo, PR/dependência maliciosa e operador que executa comandos fora do contexto aprovado. Não se pressupõe comprometimento prévio da máquina nem do GitHub.

## 2. Fluxo de dados e limites de confiança

```text
[Requisitos / prompts / Markdown / exemplos / dependências]
                          | Z1: conteúdo não confiável
                          v
[pi:select / pi:context / catálogo + Zod selecionados]
                          | fronteira: dados ≠ instruções com autoridade
                          v
[Modelo / processo Pi CLI] --(somente no uso interativo)--> [tools: write/edit/bash]
         | Z2: saída não confiável                        | Z3: host/arquivos/segredos
         v                                                v
[spec JSON + metadados] ---------------------------> [working tree / PR / CI]
         |
         v
[pi:validate: Zod + grafo] -- falha --> [recusar spec]
         |
         v
[SpecScreen: validar novamente -> registry estável]
         |               |
         |               +--> [ações declaradas/estado/feedback local]
         +--> [sourceId autorizado] --> [endpoint same-origin opcional]
                                              | Z4: API real exige authn/authz/tenant
                                              v
                                         [dados validados]

[eval:pi manual --no-tools] --> [spec, metadados, relatórios e artifacts CI]
                                  Z5: retenção, acesso e possível vazamento
```

| Fronteira | Entrada | Controle visto no código | Lacuna/observação |
| --- | --- | --- | --- |
| F1 — conteúdo → modelo | `--requirement`, prompts, skills, `knowledge/`, exemplos e docs | `AGENTS.md`, `.pi/skills/ui-catalog/SKILL.md`; seleção informativa em `scripts/select-pi-candidates.mjs` | Instruções em textos de terceiros **não têm autoridade**; orientações textuais não são isolamento técnico. |
| F2 — modelo → contrato | JSON gerado | `scripts/select-pi-context.mjs`: tipos limitados a 25, schema real obrigatório para geração, projeção conferida com lock; `scripts/validate-pi-spec.ts`: Zod + grafo | Validar no ponto de aplicação; não promover texto semântico a permissões. |
| F3 — contrato → navegador | spec de tela | `src/ui-runtime/spec-screen.tsx` valida antes de `Renderer`; `src/ui-catalog/catalog.ts` usa Zod estrito; `scripts/lib/spec-invariants.mjs` limita elementos/profundidade e verifica árvore/eventos/ações | Revisar também tamanho em bytes, strings, estado e uso de recursos por componente. |
| F4 — spec → efeitos | ações, eventos, URLs e `sourceId` | `src/ui-catalog/registry.tsx`: feedback local; `catalog.ts`: ações conhecidas e link interno; `src/ui-data/providers.ts`: fonte por ID, fetch same-origin e schema de resposta | A `processos-api` não é serviço pronto; servidor real precisa controlar identidade, autorização e escopo de locatário. |
| F5 — agente → host | `write`, `edit`, `bash`, operações de arquivos | `.pi/extensions/ui-guard.ts`: bloqueios de caminhos e heurística de comandos | **Não é sandbox nem fronteira de segurança completa**. O processo pode dispor das permissões do usuário que o executa. |
| F6 — execução remunerada → artefatos | prompts, output JSON, stderr/relatórios | `scripts/run-pi-evals.mjs`: opt-in explícito, timeout, `--no-session --no-tools`, metadados/hash; workflow manual em `.github/workflows/pi-evaluation.yml` com `contents: read` | Processos herdam ambiente; avaliar minimização de segredos, sanitização e acesso aos artifacts; hashes não garantem confidencialidade. |
| F7 — mudança → admissão | manifestos, política, evidências | `scripts/build-pi-api.mjs`, `src/ui-catalog/admission-engine/policy.json`, `.github/workflows/quality.yml` | Aprovação do manifesto não substitui revisão humana; confirmar regras da branch no GitHub. |

**Separação de autoridade:** recomendações, semantic guidance e exemplos são **dados auxiliares**; `catalog.ts`, schemas Zod, lock e políticas de admissão determinam o que é permitido. `experimental` só pode ser usado com escolha explícita e nunca representa autorização para operações externas.

## 3. Registro priorizado de ameaças (STRIDE)

Escala: **P0 crítico**, **P1 alto**, **P2 médio**, **P3 baixo**. Probabilidade é estimativa qualitativa, não frequência observada. **Risco** indica necessidade de tratamento, não vulnerabilidade explorada.

| ID | Superfície / STRIDE | Cenário e impacto | Controles identificados | Risco residual e decisão |
| --- | --- | --- | --- | --- |
| PI-01 | F5, elevação de privilégio/alteração | Um agente com ferramentas de terminal/edição altera arquivos ou ambientes fora do contrato de specs JSON. Impacto na integridade e possivelmente em segredos. | `ui-guard.ts`, políticas de PR e verificações posteriores. | **P0, prob. média — tratar.** Nunca considerar heurística de ferramenta um sandbox; isolar usuário/ambiente, limitar ferramentas e credenciais, revisar alterações. |
| PI-02 | F1–F2, falsificação/alteração | Texto de requisitos, documentação externa, resultados de buscas ou exemplos tenta se passar por instrução privilegiada; risco de prompt injection e desvio de seleção. | Instruções de agente, schemas e validação posterior. | **P1, prob. alta — tratar.** Rotular conteúdo como dado não confiável; testes adversariais e validação na saída. |
| PI-03 | F5–F6, divulgação | Segredos do processo/runner, prompts ou dados reais podem alcançar logs, saída do agente ou artifacts. | Evals opt-in, `--no-tools`, `contents: read`, checkout sem credenciais persistidas. | **P1, prob. média — tratar.** Menor privilégio, allowlist de variáveis, retenção e inspeção de saída; nenhum segredo em fixtures. |
| PI-04 | F2–F4, alteração/elevação | Spec introduz propriedades, tipo, ação, evento, link ou fonte não previstos. | Zod estrito, grafo, catálogo estável, link interno e runtime revalida. | **P2, prob. baixa sob controles atuais — monitorar.** Regressão obrigatória em mudanças de schema/adapter; não confiar só no contexto. |
| PI-05 | F7, alteração/repúdio | Candidato experimental ou evidência de teste é interpretado como admissão estável sem critérios cumpridos. | Fingerprint, `ci-required`/E2E, política de admissão, job de integração e revisão de PR. | **P1, prob. média — tratar no processo.** Independência da prova, branch protection e rastreio a SHA. |
| PI-06 | F4, divulgação/elevação | UI utiliza `processos-api` e há erro de autenticação, autorização ou filtro tenant no backend implantado. | SourceId allowlisted, limites de consulta e schema de resposta; `server-example/processos-route.mjs` é somente referência. | **P1 condicional, prob. depende do backend — bloquear produção sem revisão de serviço.** Não afirmar backend operacional. |
| PI-07 | F2–F3, negação de serviço | Spec/contexto ou respostas contêm estruturas e textos volumosos que consomem memória, tokens ou tempo de renderização. | Grafo: até 300 elementos e profundidade 30; timeout/buffer no Pi CLI de avaliação; limites de algumas props. | **P2, prob. média — tratar.** Impor limites de bytes, tamanhos agregados, duração e orçamento. |
| PI-08 | F2–F4, alteração/injeção | Conteúdo serializado pode atingir um adaptador React que futuramente renderize markup, links ou dados sem restrição. | Tipos e props fechados, sem JSX/HTML arbitrário permitido; `check-boundaries.ts`. | **P2, prob. baixa no contrato atual — monitorar.** Testar novos adapters/sinks, não presumir sanitização universal. |
| PI-09 | F6, divulgação/repúdio | Saídas originais de avaliação e relatórios são retidos/compartilhados além do necessário; hash sozinho não prova origem nem privacidade. | Hash SHA-256 e metadados em `run-pi-evals.mjs`; artefatos anexados por workflow manual. | **P2, prob. média — tratar.** Restringir acesso, tempo de retenção e conteúdo; registrar proveniência do job/commit. |
| PI-10 | F5, alteração/divulgação | CLIs que recebem caminhos e arquivos locais são invocados a partir de diretório não confiável ou por automação privilegiada. | Restrições parciais para `--out`; `--file` exige JSON e rejeita `..` em `validate-pi-spec.ts`. | **P2, prob. média — tratar.** Validar canonical path e root, proibir escrita indireta e não expor CLIs como endpoints. |
| PI-11 | F1/F7, alteração/cadeia de suprimentos | Conteúdo remoto, dependências ou scripts de sincronização atualizam exemplos/orientações sem verificação adequada de proveniência. | Procedimentos de fonte, CI e admissão; sincronização não concede contrato automaticamente. | **P1, prob. média — tratar.** Fixar referências, revisar diffs e executar fetch/instalação em ambiente de menor privilégio. |

**Cenários não confirmados:** esta revisão não reproduziu exploração de prompt injection, fuga de segredos, execução não autorizada, acesso intertenant, XSS ou abuso de recursos. Não publicar payloads nem reproduções sensíveis em issues/PR públicos; usar o canal privado indicado em [SECURITY](../SECURITY.pt-BR.md) para vulnerabilidades comprovadas.

## 4. Revisão por superfície

### Entrada

- Requisitos textuais e `$ARGUMENTS` de `.pi/prompts/ui.md` têm origem potencialmente não confiável e não devem alterar instruções superiores.
- `scripts/select-pi-context.mjs` seleciona componentes e exemplos versionados; a justificativa semântica permanece **consultiva**, mesmo que contenha linguagem imperativa.
- Screens e metadados em `src/ui-screens/` e `src/ui-screen-meta/` são JSON incluídos pelo Vite no build. A validação protege a **spec** no render; metadados e exemplos ainda precisam revisão de conteúdo/dados.
- `scripts/validate-pi-spec.ts` lê arquivo JSON fornecido por CLI, com controles de nome/caminho parciais; é utilitário de desenvolvimento, **não endpoint de upload**.

### Saída

- Esperar um único objeto `{root,elements,state?}`; filhos e slots formam árvore sem referências órfãs; tipo, props, eventos e ações precisam passar pelo catálogo. Falha deve resultar em **recusa**, não reparo com permissões extras.
- `SpecScreen` usa mensagem de bloqueio sem renderizar spec inválida. Evitar expor dados sensíveis em diagnósticos do console, relatórios de validação, prompts de reparo e artifacts.
- `eval-results/`, `reports/pi-eval/` e `reports/pi-evaluation.*` têm rastreabilidade, mas seu conteúdo pode ser confidencial. O pipeline de avaliação faz upload desses arquivos; retenção/acesso precisam política explícita.
- Não inferir segurança de HTML, URL ou dados apenas da palavra `approved`: inspecionar o **adapter** correspondente e os seus sinks.

### Execução

- **Modo interativo Pi:** `ui-guard.ts` intercepta `write/edit/bash` parcialmente e informa que é best-effort. Recomenda-se executar em workspace descartável, conta sem segredos e sem acesso privilegiado, com revisão independente de todos os diffs.
- **Avaliação real:** `run-pi-evals.mjs` só executa com `--execute` e confirmação; invoca Pi com `--no-tools`, `--no-session`, timeout e buffer. Não transformar esse comportamento em alegação de isolamento do Pi interativo.
- **Navegador:** `SpecScreen` valida novamente e encaminha apenas registries/ações catalogados; `buttonClick`, `formSubmit` e `linkClick` geram feedback local, sem persistência remota.
- **Dados remotos:** `sourceId` mapeia para adapter de código; `processos-api` realiza `fetch` same-origin, mas implantação de backend depende de autenticação/autorização reais.
- **CI:** jobs de qualidade com leitura mínima e evidência por commit reforçam integridade; revisar periodicamente permissões do GitHub Actions, ações de terceiros e as rulesets efetivas da `main`.

## 5. Plano de tratamento e critérios de aceitação para o E09

A presente entrega **documenta** os riscos; os itens a seguir são **pendências**, não controles já implementados. Preferir reforçar verificações existentes a criar uma camada paralela de aprovação.

- [ ] **P0 — PI-01:** executar Pi com identidade sem privilégios, workspace isolado, ferramentas explicitamente permitidas e credenciais indisponíveis por padrão; registrar testes de negativas de escrita e subprocessos fora do escopo.
- [ ] **P1 — PI-02:** criar suíte de prompt injection com requisitos/documentos adversariais; afirmar que nenhuma instrução de dados amplia `types`, `actions`, `sourceId` ou modifica arquivos protegidos.
- [ ] **P1 — PI-03/PI-09:** reduzir ambiente herdado pela avaliação, implementar política de logs/artifacts (redação de dados, retenção, acesso) e testes com marcadores fictícios, sem chaves reais.
- [ ] **P1 — PI-05:** verificar no GitHub as proteções exigidas para mudanças em catalog/lock/admission, e impedir que metadados declarados sejam confundidos com aprovação humana.
- [ ] **P1 condicional — PI-06:** exigir testes negativos de authn/authz e isolamento de tenant antes de habilitar backend real; nunca usar `server-example/` como backend de produção sem implementação auditada.
- [ ] **P1 — PI-11:** auditar e fixar proveniência de conteúdo remoto e dependências; separar ingestão de recomendação e autorização.
- [ ] **P2 — PI-04/PI-08:** testes de regressão Zod/grafo/runtime para tipos desconhecidos, props extras, ação/evento indevido, URL externa, fonte não reconhecida e conteúdo indevido nos adapters.
- [ ] **P2 — PI-07:** adicionar limites explícitos de tamanho da spec, do contexto, dos textos/arrays e de renderização; falhar com diagnóstico seguro.
- [ ] **P2 — PI-10:** endurecer validação de caminhos e execução de CLI em contextos automatizados; impedir arquivos fora de diretórios permitidos.
- [ ] **Operação:** revisar o modelo quando houver mudança em ferramentas Pi, schemas, ações, fonte remota, pipelines, admissão ou políticas; vincular cada mitigação a testes e SHA de revisão.

**Critério de conclusão desta etapa:** inventário de superfícies + fluxos/fronteiras + riscos priorizados + controles existentes + responsáveis lógicos e critérios de verificação registrados. **Não** significa encerramento dos riscos nem aprovação de produção.

## 6. Evidências e reprodução segura

Fontes revisadas: `.pi/extensions/ui-guard.ts`, `.pi/prompts/ui.md`, `.pi/skills/ui-catalog/SKILL.md`, `scripts/select-pi-context.mjs`, `scripts/select-pi-candidates.mjs`, `scripts/validate-pi-spec.ts`, `scripts/lib/spec-invariants.mjs`, `scripts/run-pi-evals.mjs`, `scripts/build-pi-api.mjs`, `src/ui-catalog/catalog.ts`, `src/ui-catalog/registry.tsx`, `src/ui-runtime/spec-screen.tsx`, `src/ui-runtime/screen-registry.ts`, `src/ui-data/providers.ts`, `server-example/processos-route.mjs`, `.github/workflows/quality.yml`, `.github/workflows/pi-evaluation.yml` e `.github/workflows/admission-experimental.yml`.

Verificação a executar numa cópia com dependências instaladas:

```bash
npm ci --no-audit --no-fund
npm run docs:check
npm run test:offline
npm run pi:zod-schema
npm run pi:verify
npm run validate
npm run build
```

Esta análise foi feita por inspeção remota de código; **os comandos acima não foram executados nesta entrega**. Eles são verificações propostas ao CI/operador, não provas de segurança de execução do Pi. Não ativar `eval:pi:run` nem gastar créditos sem consentimento explícito. Não inserir credenciais ou dados privados nas evidências.
