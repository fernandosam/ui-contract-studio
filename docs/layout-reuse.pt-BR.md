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


## Propostas de composição E05 — interfaces candidatas, sem admissão

A saída de [`scripts/report-layout-composition-proposals.mjs`](../scripts/report-layout-composition-proposals.mjs) transforma a evidência E05 **já conferida** e a comparação com o catálogo em cinco propostas rastreáveis. Cada registro contém:

- **Finalidade:** hipótese explícita para o agrupamento observado, a validar no fluxo real (não é equivalência funcional).
- **Propriedades:** campos dos schemas **das primitivas** pai/filho em `pi-catalog/props-json-schema.json`, com tipo, obrigatoriedade, ponteiro para a definição e identificação das ocorrências em que o campo foi usado. Valores da tela não são reproduzidos. Esses campos **não** passam a ser props da composição automaticamente.
- **Slots:** ligações candidatas `content` ao `parent.children` (ou `parent.slots.*`, conforme a evidência) e, se observado, `nestedContent` ao `child.children`, com intervalo de filhos observado. Os nomes são **propostos** e ainda não são slots Zod admitidos.
- **Dependências:** primitivas aprovadas com versão e fingerprint do lock, mais templates compostos já aprovados para **inspeção de duplicidade**, sem supor compatibilidade de comportamento. Fontes, IDs e índices da árvore permanecem auditáveis.

| Estrutura | Estratégia produzida | Razão |
| --- | --- | --- |
| `Card → Stack` | `review-existing-compositions-first` | Já aparece em templates JSON existentes; verificar reaproveitamento |
| `Card → Table` | `review-existing-compositions-first` | Já aparece em templates JSON existentes |
| `Stack → Link` | `compose-admitted-primitives` | Primitivas existentes, mas nenhum template JSON correspondente |
| `Card → Grid` | `observe-until-independent-origins` | Coincidência em uma única origem declarada |
| `Grid → Card` | `observe-until-independent-origins` | Coincidência em uma única origem declarada |

```sh
npm run patterns:reuse:proposals:check    # check determinístico, somente leitura
npm run patterns:reuse:proposals:report   # gera reports/layout-reuse/proposals.json
node --test tests/layout-composition-proposals-e05.test.mjs
npm run semantic:check
npm run semantic:report
```

O `npm run check` incorpora a validação, e o workflow de qualidade existente anexa `proposals.json` ao artefato semântico, sem novo fluxo de aprovação. O comando sempre recalcula e confere a evidência versionada e compara o catálogo e schemas atuais, recusando apontadores e propriedades inválidos. A saída gerada é **somente consultiva**: não edita Zod, `contracts.lock.json`, templates, `pi-catalog`, permissões, Admission Engine ou publicação. Para qualquer novo contrato composto, permanece necessária a verificação de compatibilidade semântica, visual, acessibilidade, estados e revisão independente.


## Validação E05 — Zod, lock de contratos e Admission Engine

Após gerar as propostas, execute a validação **somente leitura** contra o catálogo e a política oficiais:

```sh
npm run patterns:reuse:validate:check    # falha fechada; não escreve arquivos
npm run patterns:reuse:validate:report   # gera reports/layout-reuse/validation.json
npx tsx --test tests/layout-proposal-validation-e05.integration.test.ts
npm run semantic:check
npm run semantic:report
```

O validador reanalisa as telas JSON aprovadas com o **Zod real do catálogo estável Pi**, verifica as propriedades observadas com `componentDefinitions[type].props.safeParse` e compara os JSON Schemas exportados a `z.toJSONSchema` em execução. Confere evidências e ponteiros das propriedades, cardinalidade dos slots candidatos, versões/fingerprints das primitivas e o manifesto Pi v3. Reutiliza o `evaluatePolicy` do Admission Engine para rejeitar política inválida; IDs das propostas não podem colidir com allowlist, receitas, entradas, protocolos, admissão automática CI ou tipos publicados. Não cria nova decisão de aprovação nem protocolo.

**Validação aprovada apenas confirma a coerência documental e contratual da proposta consultiva.** Não admite propriedades/slots de um novo composto, ações, execução React, E2E, acessibilidade ou promoção estável. Cada registro do relatório declara `canPublish: false`, `canExecuteAsComposite: false`, `canGrantPiPermissions: false` e `e2eCertification: not-performed`. Desvios de origem e política são bloqueados. O job de qualidade existente executa a validação com Zod instalado e preserva o relatório como artefato CI, sem nova camada de aprovação nem alteração no registro Pi.
