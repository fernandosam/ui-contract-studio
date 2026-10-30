[English](layout-reuse.md) | [Português](layout-reuse.pt-BR.md)

# E05 — Evidências auditáveis de reutilização estrutural em layouts JSON aprovados

O índice versionado está em [`src/ui-requirements/layout-reuse-evidence.json`](../src/ui-requirements/layout-reuse-evidence.json). Ele é **derivado** de `src/ui-patterns/*.json` com seus `*.meta.json`, não de JSX gerado ou semelhança visual. Somente os padrões com `approved: true`, `immutableContracts: true`, `sourceRoot` correspondente e `originScreen` não vazio são considerados. A árvore de cada padrão é confrontada com os tipos do lock de contratos e suas invariantes estruturais. Aqui, “aprovado” significa apenas o registro existente no catálogo, **não uma aprovação humana independente comprovada**.

## Método e resultados

São identificados **pares adjacentes de tipos pai–filho**, preservando a relação `children` ou `slots.*` e desconsiderando IDs e valores textuais variáveis. Cada ocorrência registra padrão, origem declarada, arquivo JSON, metadados, IDs do pai e do filho, relação e posição do filho. Repetições no mesmo padrão **não** comprovam reutilização entre layouts. Padrões diferentes com o mesmo `originScreen` ficam classificados como **candidatos da mesma origem**, sem evidência independente entre origens. Os rótulos de origem vêm dos metadados, sem presumir que uma tela histórica original continue disponível.

Na base E05, com oito padrões aprovados no catálogo, três relações aparecem em origens distintas:

| Estrutura | Padrões com evidências | Origens declaradas |
| --- | --- | --- |
| `Card → Stack` | `detail-view`, `form-dialog` | `dashboard`, `playground` |
| `Card → Table` | `crud-list`, `detail-view` | `usuarios`, `dashboard` |
| `Stack → Link` | `detail-view`, `form-dialog` | `dashboard`, `playground` |

`Card → Grid` e `Grid → Card` ocorrem em padrões diferentes, porém com uma única origem declarada cada; por isso permanecem candidatos. São **indícios estruturais, e não componentes prontos para reutilização**: não comprovam equivalência semântica, comportamento, responsividade, acessibilidade, uso efetivo em produção, revisão por screenshot nem certificação visual. Nenhuma nova API, hierarquia, permissão ou promoção automática pode resultar dessas contagens.

## Atualização e verificações

```sh
npm run patterns:reuse:check   # falha caso o índice versionado esteja desatualizado
npm run patterns:reuse:report  # mesmo check + gera reports/layout-reuse/evidence.json
npm run patterns:reuse:update  # regenera explicitamente o índice para revisão
npm run test:offline
npm run semantic:check
npm run semantic:report
```

Examine as alterações de fontes e do índice antes de atualizar. O `npm run check` atual executa a verificação; o workflow de qualidade existente anexa o relatório às evidências semânticas. `--report` não altera o índice versionado, e `--write` exige execução intencional. O analisador não modifica `pi-catalog/contracts.json`, schemas Zod, componentes admitidos, ações, permissões ou decisões de publicação.

Para alegações mais fortes, é necessária revisão humana das estruturas e evidência focal de navegador/acessibilidade vinculada à implementação. Esta análise offline não substitui o E2E completo.
