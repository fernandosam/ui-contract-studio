[English](README.md) | [Português](README.pt-BR.md)

# Documentação — UI Contract Studio

Esta página separa **guias vigentes** de **registros históricos de auditoria**. Para o comportamento atual, consulte primeiro os manifestos e o código indicados em [arquitetura](architecture.pt-BR.md).

## Guias vigentes

| Guia | Objetivo |
| --- | --- |
| [README](../README.pt-BR.md) | Apresentação e instalação |
| [Arquitetura](architecture.pt-BR.md) | Fontes de verdade e camadas |
| [Integrações externas (E12)](external-integrations.pt-BR.md) | Decisão inicial arquivos/CLI e evolução posterior com SDK |
| [Guia de integração (E12)](integration-guide.pt-BR.md) | Uso atual SDK/CLI, exemplos executáveis, versões fixadas e erros seguros |
| [Componentes e contratos](components.pt-BR.md) | shadcn/ui, ReUI, composições e admissão |
| [Admission Engine](admission-engine.pt-BR.md) | Publicação experimental e distribuição pós-E2E |
| [Estratégia de composições](composition-strategy.pt-BR.md) | Dependências, classificação semântica e novos exemplos ReUI |
| [Checklist semântico de componentes](semantic-knowledge-checklist.pt-BR.md) | Revisão de conhecimento por componente, evidências, lacunas e validação |
| [Prioridade de enriquecimento semântico (T25)](semantic-enrichment-priority-t25.pt-BR.md) | Pontuação determinística e consultiva para revisão de composições por IA |
| [Processo de enriquecimento semântico (T30)](semantic-enrichment-workflow.pt-BR.md) | Passo a passo auditável para novos componentes shadcn e exemplos ReUI, priorização, CI e E2E |
| [Descoberta e comparação semântica](semantic-catalog-discovery.pt-BR.md) | Busca e comparação nos catálogos Primitivas/Compostos, evidências e disponibilidade Pi |
| [Auditoria de aderência semântica (T31)](semantic-contract-conformance-t31.pt-BR.md) | Vínculos Zod/Pi, decisões de lacunas e acionamento obrigatório ao alterar conhecimento |
| [Avaliação de qualidade de layout](layout-quality.pt-BR.md) | Notas consultivas de hierarquia, agrupamento, densidade e responsividade |
| [Evidências de reutilização de layout (E05)](layout-reuse.pt-BR.md) | Estruturas recorrentes entre origens, referências ao código e auditoria determinística |
| [Temas versionados (E06)](versioned-themes.pt-BR.md) | Tokens fechados, versões imutáveis e bloqueio de CSS arbitrário |
| [SDK tipado de contratos (E12)](typed-contract-sdk.pt-BR.md) | Geração, inspeção e validação locais e tipadas de contratos JSON aprovados |
| [Agentes e Pi](agents.pt-BR.md) | Geração segura e validação de specs |
| [Modelo de ameaças do Pi Agent (E09)](pi-agent-threat-model.pt-BR.md) | Fronteiras de confiança, revisão das entradas/saídas/execução e riscos priorizados |
| [Eventos de execução Pi (E10)](pi-execution-events.pt-BR.md) | Identificadores correlacionados, eventos de ciclo de vida, segurança e diagnóstico opcional |
| [Desenvolvimento](development.pt-BR.md) | Ambiente, testes, CI e E2E |
| [Governança](governance.pt-BR.md) | Revisão e auditoria contínua do repositório público |

## Referências especializadas

- [Auditoria T19 da cobertura semântica das 31 famílias ReUI](semantic-knowledge-coverage-t19.pt-BR.md) — matriz 31/559/39 e checklist T01
- [Revisão semântica T17 (Alert, Card, Textarea, Progress)](semantic-knowledge-t17.pt-BR.md)

- [Validação semântica integrada T14 (formulários e candidatos)](semantic-knowledge-integration-t14.pt-BR.md)
- [Integração semântica anterior T08](semantic-knowledge-integration-t08.pt-BR.md)
- [Fontes de dados e DataTable](integracao-dados.pt-BR.md)
- [Biblioteca ReUI](reui-composite-library.pt-BR.md)
- [Cobertura funcional das 31 famílias ReUI](reui-functional-coverage-31.pt-BR.md) — implementações, limites e certificação pendente
- [Fidelidade visual das composições](revisao-visual-shadcn.pt-BR.md)
- [Auditoria de exemplos oficiais](official-component-visual-audit.pt-BR.md)
- [Sandbox conectada](../sandbox/README.pt-BR.md)
- [Segurança](../SECURITY.pt-BR.md) e [avisos de terceiros](../THIRD_PARTY_NOTICES.pt-BR.md)

## Histórico e auditorias

O [índice histórico](history/README.pt-BR.md) agrupa decisões e levantamentos de versões anteriores. Contagens e instruções registradas em auditorias antigas **não são automaticamente válidas para a versão atual**.

Veja também o [CHANGELOG](../CHANGELOG.pt-BR.md) e o [guia de contribuição](../CONTRIBUTING.pt-BR.md).
