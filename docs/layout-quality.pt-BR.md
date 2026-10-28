[English](layout-quality.md) | [Português](layout-quality.pt-BR.md)

# Avaliação automática da qualidade de layout

A qualidade de layout é **uma estimativa consultiva** calculada diretamente sobre a árvore JSON produzida para cadastro, login, busca e dashboard. Ela aparece na própria prévia de `RequirementsWizard` e `PatternWizard` e nos relatórios de auditoria já existentes. Não foi criado workflow, gate, estado de aprovação, regra de merge ou etapa de homologação.

## Modelo de pontuação

A função pura `evaluateLayoutQuality(requirements, screen)`, em `src/ui-requirements/layout-quality.ts`, produz de 0 a 100 pontos. As quatro dimensões têm o mesmo peso (25 pontos) e cinco verificações estáticas de 5 pontos. Falhas subtraem pontos e produzem `findings[]` com `dimension`, `code`, `nodeIds`, `deduction`, `message` e `suggestion`, para correção por IA ou por pessoa:

| Dimensão | Evidências verificadas |
| --- | --- |
| **Hierarquia (25)** | Contêiner principal, título, ordem das regiões, primazia do conteúdo e posição de ações/notas |
| **Agrupamento (25)** | Stack/Grid previsto, pertencimento dos campos e indicadores, rótulos/títulos, referências e espaçamento |
| **Densidade (25)** | Quantidade de colunas conforme a intenção, limites, grupos não vazios, equilíbrio de conteúdo e gaps |
| **Responsividade (25)** | Largura e centralização declaradas, colunas compatíveis com o CSS existente, pilhas verticais, ordem DOM e ausência de sobrescritas livres |

A regra é determinística, não tem pesos aprendidos e lê os perfis semânticos já existentes (`registration-layout.json`, `pattern-layouts.json`). A saída inclui `score`, `scores` por dimensão, diagnósticos e as marcas `basis: static-declarative`, `policy: advisory-only` e `runtimeEvidence: not-executed`. Uma árvore malformada recebe **0** e diagnóstico, em vez de ser apresentada como evidência de boa qualidade. Listagem (`list`) continua sem nota específica, porque não possui o mesmo contrato de layout detalhado; não se inventa cobertura.

## Uso e rastreabilidade

Após gerar a prévia, o painel de qualidade mostra a nota global, as quatro notas parciais e correções sugeridas. O JSON original **não é alterado** pela avaliação. Os comandos existentes produzem `layoutQuality` por cenário, separadamente de `correct`, blockers, conformidade Zod e rastreabilidade:

```sh
npm run requirements:audit
npm run requirements:patterns:audit
npx tsx --test tests/layout-quality.integration.test.ts
npm run test:offline
npm run typecheck
```

A prioridade de correção pode partir dos diagnósticos de menor pontuação. **Nenhuma nota mínima bloqueia geração, PR ou auto-merge**; as verificações de admissão e a independência da revisão dos contratos Pi continuam inalteradas. O mapeamento de impacto existente aponta mudanças no avaliador para as famílias de interface abrangidas.

## Limites explícitos

A pontuação não captura geometria real, overflow, cor, contraste, alinhamento de pixels, breakpoints executados, teclado ou acessibilidade. “Responsividade” significa compatibilidade **inferida** da árvore declarativa com o CSS responsivo já existente, não aprovação visual. E2E, inspeção no navegador e revisão humana permanecem evidências separadas quando necessárias. A avaliação não adiciona tipos/props ao Zod, não admite novos componentes, não autoriza actions e não amplia permissões Pi. Mesmo 100/100 não constitui certificação de produção.

## Próxima evolução: ciclo conservador de autocorreção

A função `improveLayoutQuality(requirements, generated)`, em `src/ui-requirements/layout-repair.ts`, executa uma tentativa **limitada a 12 alterações** sobre uma cópia em memória do JSON gerado. Os dois assistentes de prévia e as auditorias existentes usam a mesma função, sem novo botão, etapa de aprovação, workflow ou critério de merge. A proposta é exclusivamente uma melhoria de composição visual; não altera o pedido ou a semântica funcional.

**Mudanças permitidas:** reordenar exclusivamente filhos já existentes e com a mesma composição de IDs; restaurar propriedades **já presentes** de `direction`, `gap`, `columns`, `maxWidth` e `centered`, com os valores previstos pelos perfis semânticos revisados. Não são inseridos/removidos nós, não há troca de tipos, criação de props, alteração de conteúdo, rótulos, eventos, ações, fontes de dados, permissões ou código React. Campos ausentes, conteúdo conflitante e layouts sem perfil específico não são “inventados”.

**Política de aceitação técnica, não aprovação:** um candidato somente substitui a prévia em memória quando o JSON inicial passou nas invariantes do catálogo, o candidato passou no **Zod Pi + grafo + rastreabilidade independente dos requisitos**, a nota total aumentou e nenhuma das quatro notas piorou. Se qualquer verificação falhar, a prévia original é preservada. A saída registra `status: unchanged | improved | not-applicable`, pontuação antes/depois, motivo e lista de caminhos alterados. A mesma entrada produz o mesmo resultado e uma segunda execução não repete alterações.

```sh
npx tsx --test tests/layout-repair.integration.test.ts tests/layout-quality.integration.test.ts
npm run requirements:audit
npm run requirements:patterns:audit
npm run typecheck
npm run build
```

A verificação automática de integridade **não é** uma nova aprovação de produto, componente ou PR; ela impede que uma correção visual burle controles que já existiam. A nota 100 não certifica renderização, acessibilidade ou E2E, que continuam exigindo evidência própria quando aplicável.
