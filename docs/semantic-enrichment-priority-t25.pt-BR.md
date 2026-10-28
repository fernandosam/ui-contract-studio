[English](semantic-enrichment-priority-t25.md) | [Português](semantic-enrichment-priority-t25.pt-BR.md)

# T25 — Priorização automática de enriquecimento semântico

**Escopo:** apoio à curadoria e à revisão de conhecimento para composição de interfaces por agentes de IA. **Fonte:** registros existentes em `src/ui-catalog/knowledge/`, guias incorporados por `scripts/lib/semantic-knowledge.mjs` e inventário versionado de exemplos ReUI. **Natureza:** estritamente consultiva; a pontuação **não** admite contratos, não autoriza props, ações ou eventos e não modifica schemas Zod nem permissões Pi.

## Como calcular e auditar

`rankSemanticEnrichment`, em `scripts/lib/semantic-priority.mjs`, calcula uma soma **inteira** de sete parcelas. Todos os pesos e limites são fixos, sem aprendizagem ou consultas externas. A principal dimensão de impacto para IA é a recorrência em exemplos de composição e a centralidade como integração semântica; riscos não implementados e de runtime elevam a prioridade de revisão, **não** a disponibilidade da API.

| Critério | Regra | Máximo | Motivo |
| --- | --- | ---: | --- |
| `reuiExamples` | 0→0; 1–5→4; 6–15→8; 16–30→12; 31+→16 | 16 | Componentes presentes em mais exemplos ReUI oferecem maior alcance potencial ao planejamento por IA. |
| `inboundIntegrations` | 4 por outro perfil que o cite; teto 20 | 20 | Componente referenciado por muitas composições precisa de semântica precisa. |
| `outboundIntegrations` | 2 por integração candidata distinta; teto 12 | 12 | Mais decisões de composição exigem critérios de quando usar e evitar. |
| `unimplemented` | 3 por capacidade `documented-not-implemented`; teto 18 | 18 | Risco de o agente supor API não implementada. |
| `runtimeReview` | 3 por capacidade `runtime-review-required`; teto 12 | 12 | Risco de comportamento não verificado, especialmente foco, teclado e acessibilidade. |
| `highRiskTests` | 2 por teste derivado `manual-a11y` ou `candidate-not-executable`; teto 8 | 8 | Revela necessidade de avaliação, não resultado de teste executado. |
| `documentationGaps` | Overlay ausente +12; `draft` +6; sem `agentNotes` +4; sem `whenNotUse` +4; teto 20 | 20 | A lacuna de instruções limita decisões seguras dos agentes. |

**Pontuação máxima teórica: 106 pontos.** Classificação decrescente por soma; empate por nome do componente em ordem lexical estável. Integrações são **referências candidatas nos registros**, não dependências de runtime comprovadas. Os exemplos vêm do baseline versionado, não de estatísticas de uso em produção.

A entrada de cada componente fornece `rank`, `score`, `points` por critério, `signals` (quantidade de exemplos, componentes que o citam, integrações, IDs das lacunas e testes), `evidenceSources`, `dataCompleteness` e `missingData`. Referências de integração são desduplicadas por componente, nomes e IDs são ordenados, e os tetos evitam que uma categoria domine sem limite. O código **não** atribui pontos com base em `approvedPiType`, dependências admitidas, autorização ou estado de publicação.

## Dados incompletos

Um perfil sem overlay ou inventário recebe `dataCompleteness: "partial"` e lista explicitamente o que falta. Uma capacidade ausente **não é inferida como implementada ou como falha conhecida**: contadores de risco usam apenas estados registrados, e falta de curadoria contribui exclusivamente em `documentationGaps`. O resultado é uma *fila de investigação*, não uma certificação; uma pontuação maior não implica liberação, gravidade comprovada, uso real ou tarefa automaticamente executável. Candidatos continuam sujeitos ao Admission Engine e à revisão humana.

## Execução e rastreabilidade

Na raiz do repositório:

```bash
node --test tests/semantic-priority-t25.test.mjs
npm run semantic:check
npm run semantic:report
npm run docs:check
```

O relatório derivado `reports/composition-analysis/semantic-knowledge.json` passa a expor `enrichmentPriorities.criteria` e `enrichmentPriorities.entries`, junto aos perfis e evidências originais. O mesmo campo acompanha a análise de composição existente. Para auditar uma posição, consulte `points`, IDs em `signals` e o respectivo `curatedSource`; verifique evidências no código com `semantic:check`. Não versionar resultados gerados como autorização nem editar manualmente suas pontuações.

**Limitações:** pesos são heurísticas explícitas para ordenação relativa, não estimativas estatísticas de risco; contagem de exemplos e integrações documentadas não mede adoção; testes derivados não significam testes executados; análise estática não substitui E2E ou inspeção de acessibilidade. Nenhuma alteração é feita ao Admission Engine, catálogo Pi, tipos Zod ou permissões.
