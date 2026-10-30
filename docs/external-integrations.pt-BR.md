[English](external-integrations.md) | [Português](external-integrations.pt-BR.md)

# E12 — Casos de uso externos e superfície pública mínima de integração

**Decisão (escopo desta etapa):** reutilizar o **catálogo somente de leitura, distribuído em arquivos, e a CLI local de validação**. Não criar API HTTP, SDK, protocolo de plugins, pacote publicável, execução Pi remota nem adaptador genérico de aplicação. Este documento define uma *forma de integração para uma revisão Git fixada*, não uma implementação de serviço nem garantia de compatibilidade entre revisões arbitrárias.

## Evidências e hipóteses

Confirmado no repositório:

- `pi-catalog/contracts.json` é um manifesto Pi gerado com `schemaVersion: 3` e um **único array `components`**. Cada entrada contém `type`, `version`, `lifecycle`, `stability` e `fingerprint`. O catálogo também inclui entradas experimentais; presença nele **não** autoriza uso no canal padrão.
- `pi-catalog/examples/` contém exemplos JSON, e `pi-catalog/props-json-schema.json` é uma projeção gerada das propriedades. Os schemas Zod em `src/ui-catalog/` continuam sendo a fonte de verdade.
- `npm run pi:validate -- --file=<arquivo.json>` usa o Zod real e as invariantes do grafo; o canal padrão é stable e `--channel=experimental` exige opção explícita. `npm run pi:api:check` identifica projeções desatualizadas.
- `SpecScreen` valida JSON não confiável antes da renderização. É um componente React no código-fonte, **não** um SDK público distribuído. O acesso remoto de `processos-api` exige permissão de um host confiável e um backend que não é fornecido neste repositório.
- `package.json` define `private: true`; não há distribuição de pacote externo nem endpoint HTTP público suportado.

São **consumidores potenciais**, não demanda comprovada: geradores de UI de terceiros, pipelines de CI externos, aplicações hospedeiras e navegadores de catálogo externos. Esta etapa não encontrou medições de tráfego externo, requisitos reais de autenticação, SLO de produção ou adoção por parceiros.

## Matriz de casos de uso

| Prioridade | Consumidor e objetivo | Interface mínima existente | Limite / decisão |
| --- | --- | --- | --- |
| P0 | Agente em outro repositório seleciona tipos autorizados e gera tela JSON | `pi-catalog/contracts.json` fixado em revisão Git, exemplos selecionados e `pi:validate` local | Somente stable; exemplos não concedem capacidades |
| P0 | CI externa aprova/rejeita uma tela JSON antes de publicá-la | Código de saída e diagnósticos JSON da CLI `pi:validate` | Validar na mesma revisão do renderizador; erro ou indisponibilidade bloqueia publicação |
| P1 | Ferramenta externa consulta nomes, versões, maturidade e propriedades | Manifesto somente de leitura; opcionalmente schema gerado para consulta | Conhecimento semântico não autoriza APIs nem ações |
| P1 | Equipe de aplicação deseja renderizar JSON no próprio host React | Integração pelo código-fonte pode ser avaliada à parte | **Não existe contrato público de embedding**; sem SDK, CSS/registry estável ou distribuição binária |
| Adiado | Backend disponibiliza dados reais para tabela | Adaptador restrito `processos-api` same-origin com controle do host | Não é API remota genérica; autenticação, autorização, filtros e auditoria pertencem ao host |
| Adiado | Geração remota, admissão, publicação, webhooks ou operações de escrita | Nenhuma | Sem caso comprovado; dependem de novo desenho e revisão |

As prioridades são uma proposta de sequência, **não** métricas de demanda.

## Superfície pública v0: três recursos/operações, nenhum serviço novo

1. **Descoberta (leitura):** `pi-catalog/contracts.json` de um **commit Git SHA específico**. Exigir `schemaVersion === 3`; ler `components`; selecionar somente entradas com `lifecycle === "stable"` e `stability === "stable"`. Registrar `type`, `version` e `fingerprint` com a tela produzida ou metadados da entrega. Rejeitar tipos ausentes/duplicados, formato desconhecido, maturidade inesperada e revisão divergente. O fato de o repositório ser público não é autorização.
2. **Referência de autoria (leitura):** `pi-catalog/examples/<Tipo>.json` apenas para tipos selecionados. `pi-catalog/props-json-schema.json` pode apoiar inspeção após `npm run pi:zod-schema`, mas projeções e exemplos **não substituem Zod** nem autorizam propriedades, ações, eventos, JSX, URLs ou rede não declarados.
3. **Validação (local, falha segura):** usar `npm run pi:validate -- --file=reports/generated/screen.json` na revisão verificada (ou caminho local sem `..`). Código de saída diferente de zero ou impossibilidade de executar a CLI significa rejeição, não aprovação tácita. O diagnóstico JSON contém `valid`, `channel` e `issues` limitado. Consumidores externos usam stable/padrão; experimental é faixa separada de desenvolvimento, não promessa pública.

**Exemplo mínimo de consumo** (ilustrativo; requer Node.js 22+, `npm ci`, arquivo JSON real e checkout fixado em SHA revisado):

```bash
npm ci
npm run pi:api:check
npm run pi:validate -- --file=reports/generated/screen.json
```

A CI consumidora deve criar o arquivo no caminho informado; `pi:validate` **não** busca arquivos externos, atende requisições nem disponibiliza validador remoto. Para alterações de contratos/conhecimento, executar também `npm run contracts:check` e `npm run semantic:check`. `npm run semantic:report` é diagnóstico local, fora da superfície pública. **Não habilitar experimental por padrão em integrações de produção.**

## Responsabilidades, compatibilidade e fronteiras de confiança

- **Autoridade:** definições Zod, lock revisado (`src/ui-catalog/contracts.lock.json`) e políticas de admissão controlam permissões e maturidade. O manifesto Pi é derivado, não registro alternativo de aprovação. SemVer vale por tipo de contrato; `schemaVersion: 3` representa a estrutura do manifesto, não a versão do componente.
- **Atualização:** fixar commit imutável. Para adotar outro commit, comparar versão/fingerprint de cada tipo utilizado, conferir projeções e validar com Zod real; revisar alterações semânticas/comportamentais e testar telas afetadas. Não aceitar automaticamente fingerprint alterado nem presumir compatibilidade de runtime só porque o fingerprint permaneceu igual. Migração nunca é implícita.
- **Dados e permissões:** não publicar segredos, dados pessoais, tokens, URLs privadas, CSS arbitrário ou código executável em specs/exemplos/diagnósticos. Permissões remotas são responsabilidade expressa do host e **não vêm do JSON nem do Pi**. O adaptador same-origin existente não é API pública. Autenticação, autorização e ações sensíveis exigem revisão própria.
- **Falhas:** arquivo ausente, manifesto inválido, tipo/versão não suportado, falha de validação, propriedade desconhecida, indisponibilidade de rede ou incompatibilidade do host devem bloquear o fluxo. Não voltar silenciosamente a experimental, implementações React não revisadas ou formato antigo do manifesto.
- **Operação:** acesso ao repositório, isolamento do processo, política de tentativas, credenciais de deploy, testes de runtime e tratamento de erros cabem ao consumidor. Não há SLA de disponibilidade nem execução remota autenticada prometidos.

## O que permanece interno ou fora do contrato público

Módulos Zod/registry, caminhos do código de componentes, props de `SpecScreen`, escrita/publicação do Admission Engine, certificados experimentais, prompts/ferramentas do agente, índices semânticos, arquivos locais de telemetria, estado da aplicação, ações arbitrárias, adaptadores de rede e segredos de CI **não são APIs públicas de serviço**. Sua visibilidade no código aberto não cria compromisso de estabilidade. Em particular, a E12 não autoriza novos `/api/*`, ferramentas MCP, webhooks, `POST /generate`, `POST /validate`, ações, embeds de navegador, exports npm ou listeners de rede.

## Critérios para ampliar a integração

Só propor nova superfície quando um consumidor externo identificado demonstrar (a) tarefa concreta impossível com arquivos fixados + CLI, (b) volume, latência, autenticação e sensibilidade de dados esperados, (c) responsável por implantação, compatibilidade e suporte, e (d) revisão de segurança das fronteiras E09/E10. Preferir o menor incremento: distribuição de artefatos reproduzíveis/versionados antes de endpoint de rede; consulta somente de leitura antes de escrita. Validação remota exige isolamento, cotas, limites e diagnósticos sem dados sensíveis; SDK de renderização exige pacote com versionamento e contrato do host próprios. Nenhum dos dois é autorizado nesta etapa.

## Verificação e rastreabilidade

Evidências: [arquitetura](architecture.pt-BR.md), [Agentes e Pi](agents.pt-BR.md), [ciclo de admissão](admission-engine.pt-BR.md), [isolamento E09](pi-isolation.pt-BR.md), [integração de dados](integracao-dados.pt-BR.md), [versionamento contratual](contract-versioning.pt-BR.md) e [eventos E10](pi-execution-events.pt-BR.md).

Para esta alteração **somente documental**: executar `npm run docs:check`, `npm run semantic:check`, `npm run semantic:report` e `npm run test:offline` em checkout preparado. Esses comandos não certificam interoperabilidade externa nem E2E de navegador; o E2E completo permanece manual na main. Esta etapa não altera Zod, lock, permissões Pi, políticas de admissão, rotas HTTP ou formato dos artefatos publicados.
