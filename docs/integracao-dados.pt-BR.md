[English](integracao-dados.md) | [Português](integracao-dados.pt-BR.md)

# Fontes de dados do DataTable

A propriedade `sourceId` aceita apenas `demo-processos` e `processos-api` e é validada pelo catálogo Zod. A spec não aceita URLs de terceiros.

## `demo-processos`

Dataset local fictício com 57 linhas. Simula paginação e busca delegadas à fonte para testes sem servidor; não usa rede.

## `processos-api`

A aplicação solicita apenas `GET /api/ui-data/processos` (mesma origem, `credentials: same-origin`), com `page` (base 0), `pageSize` (5–100), `search`, `sortKey` e `sortDesc`. Resposta JSON:

```json
{"rows":[{"id":"P1","values":{"processo":"P1","situacao":"Em análise"}}],"total":1}
```

Backend **não fornecido** neste protótipo. Implementá-lo no servidor da aplicação, exigindo autenticação/autorização, validação de entrada, limites reais, filtros de acesso, auditoria e tratamento de erros. Não colocar endereço remoto ou segredos em um schema gerado pela IA.

A seleção é mantida por IDs e pode ser associada ao estado `selectedIds` em json-render. A seleção local entre páginas será preservada, mas operações em lote exigem serviço próprio e autorização. Valores mostrados em tabelas continuam texto, sem execução de HTML.
