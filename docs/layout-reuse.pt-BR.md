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

## Comparação E05 com o catálogo — evitar composições duplicadas

A etapa seguinte compara os **cinco** candidatos estruturais E05 com primitivas base aprovadas no lock de contratos e os **37 templates compostos JSON ativos e revisados** declarados em `generated-manifest.json`:

| Estrutura | Evidência de origem | Templates JSON existentes | Orientação |
| --- | --- | --- | --- |
| `Card → Stack` | Origens distintas | Presente (por exemplo, `Login01`, `Signup01`, `SiteCardsForms`) | Verificar composições existentes antes de propor outra |
| `Card → Table` | Origens distintas | `Dashboard01`, `Sidebar09` | Inspecionar essas composições primeiro |
| `Stack → Link` | Origens distintas | Nenhuma relação estática encontrada nos templates | Combinar as primitivas existentes `Stack` e `Link` |
| `Card → Grid` | Mesma origem | Presente (por exemplo, `Dashboard01`, `SiteCardsStats`) | Evidência ainda provisória; inspecionar templates |
| `Grid → Card` | Mesma origem | Nenhuma relação estática encontrada nos templates | Evidência provisória; compor primitivas aprovadas |

```sh
npm run patterns:reuse:compare:check   # validação determinística e offline, sem alterar arquivos
npm run patterns:reuse:compare:report  # mesma validação + reports/layout-reuse/comparison.json
```

O relatório registra IDs dos layouts de origem, classificação de independência, referências ao lock das primitivas e, para cada template correspondente, **arquivo, IDs dos nós pai/filho, relação e posição**. Cada composição conta apenas uma vez, mesmo se contiver várias ocorrências do mesmo par. A verificação integra o `npm run check` e o workflow de qualidade existentes, sem criar outra camada de aprovação.

Uma correspondência estrutural de dois nós **não comprova** substituição segura, equivalência de propriedades/estados/eventos, acessibilidade ou qualidade visual. A análise cobre apenas templates JSON revisados no manifesto; não inspeciona implementações TSX/ReUI arbitrárias. A ausência de correspondência **não** autoriza criar componentes: primeiro compor primitivas existentes e tratar capacidades realmente ausentes por revisão separada. O processo não modifica schemas Zod, permissões Pi, contratos publicados ou decisões do Admission Engine.
