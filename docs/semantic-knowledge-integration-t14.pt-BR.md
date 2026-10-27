[English](semantic-knowledge-integration-t14.md) | [Português](semantic-knowledge-integration-t14.pt-BR.md)

# T14 — Validação integrada de seleção, formulários e composições (P1)

**Revisão:** 2026-10-27. **Padrão:** [checklist T01](semantic-knowledge-checklist.pt-BR.md) e [validação T08](semantic-knowledge-integration-t08.pt-BR.md). **Natureza:** documentação, evidência estática e testes de regressão; sem admissão de novas capacidades Pi.

## Origem das mudanças

Esta branch integra, para revisão cruzada, os registros e testes de [T09 PR #37](https://github.com/fernandosam/ui-contract-studio/pull/37), [T11 PRs #40](https://github.com/fernandosam/ui-contract-studio/pull/40), [#41](https://github.com/fernandosam/ui-contract-studio/pull/41), [#42](https://github.com/fernandosam/ui-contract-studio/pull/42), [T12 PR #43](https://github.com/fernandosam/ui-contract-studio/pull/43) e [T13 PR #44](https://github.com/fernandosam/ui-contract-studio/pull/44). Tabs e Table (T10, PRs #38/#39) e T02–T07/T08 já estão na `main`. Esta consolidação não promove nem mescla automaticamente os PRs de origem.

## Inventário auditado

| Entrega | Componentes | Estado de admissão | Estática / documentada sem implementação / revisão de runtime | Pares de evidência | FAQ | Integrações | Testes derivados |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| T09 | Input, Checkbox, Radio, RadioGroup, Switch | RadioGroup é wrapper React **não admitido**; os outros já constam no lock | 31 / 15 / 10 | 73 | 41 | 46 | 43* |
| T11 | ButtonGroup, Drawer, Tooltip | Contratos já aprovados | 14 / 11 / 6 | 32 | 17 | 20 | 19 |
| T12 | Field, DatePicker, DataTable | Contratos extension já aprovados | 23 / 11 / 6 | 60 | 19 | 22 | 22 |
| T13 | Combobox, Command, Sheet | `candidate-not-admitted` (sem tipo Pi) | 15 / 7 / 6 | 44 | 15 | 24 | 23 |
| **Total** | **14 registros** | **10 tipos aprovados preexistentes e 4 não admitidos** | **83 / 44 / 28** | **209** | **92** | **112** | **107*** |

*Os 43 casos T09 incluem dois casos `candidate-not-executable` acrescentados em T14 para `radio-group-pi-type` e `required-and-invalid-pi`. As 209 evidências são referências textuais inventariadas, não 209 testes de execução. O relatório gerado é consultivo.

Os registros de T02–T07 (Dialog, DropdownMenu, Popover, Select, Accordion e Button) e T10 (Tabs e Table), além do modelo AlertDialog, permanecem disponíveis como base, com testes anteriores preservados.

## Riscos e decisões de integração

1. **Radio vs. RadioGroup:** o wrapper de interface `RadioGroup` pode existir sem um tipo Pi homônimo. `Radio` permanece o contrato admitido. Teste negativo de admissão obrigatório antes de qualquer ampliação futura.
2. **Switch:** `required` e `invalid` podem existir no wrapper upstream, mas não são props autorizadas no contrato Pi. Foi acrescentado teste candidato e preservada a classificação `documented-not-implemented`.
3. **Combobox vs. Select vs. Input:** busca/seleção, lista fixa e texto livre têm papéis distintos; `Combobox` não pode ser emitido como nó Pi nesta entrega.
4. **Command vs. DropdownMenu:** apresentar atalho não registra hotkey; selecionar um item não autoriza navegação ou efeito remoto. `Command` é candidato documental, não API admitida.
5. **Sheet vs. Drawer vs. Dialog:** sua implementação React e dependência de Dialog não concedem tipo Pi Sheet. Fechamento não implica persistência ou descarte validado. Testes de foco, teclado e viewport continuam pendentes quando marcados `runtime-review-required`.
6. **Field / DatePicker / DataTable:** comprovar versões e contratos preexistentes; validação de erro, data, origem remota, seleção e ações dependentes de backend não podem ser ampliadas por documentação.
7. **Integrações e FAQ:** todas são aconselhamento; `integrationCandidates[].admission` continua `advisory-only` no relatório e `not-granted` na projeção do agente. Evidências locais apenas confirmam trechos versionados.

## Regressões adicionadas

`tests/semantic-integration-t14.test.mjs` testa inventário de todos os 23 overlays (T01–T13), fonte oficial e revisão, projeção semântica, igualdade dos estados, vínculos de evidência, rastreamento de lacunas a casos derivados, arestas de integração entre famílias e FAQ. Executa cenários negativos com evidência falsa, promoção indevida e comprovação de runtime fabricada, além de testar que tipos candidatos nunca chegam a `selectAgentSemanticAdvice`.

Os testes específicos de T09, T10, T11, T12, T13 e T08 são preservados. O teste transversal opera com contagem mínima para permitir adições futuras sem perder os componentes obrigatórios.

## Execução e registro

O workflow [`quality.yml`](../.github/workflows/quality.yml) executa em PR: `npm run semantic:check`, `npm run semantic:report`, `npm run docs:check`, `npm run test:offline`, `npm run contracts:diff` e validações de integração/build. **Resultados efetivos devem ser consultados no run da CI da T14.** Não confundir o inventário estático realizado via GitHub com uma execução local npm nem afirmar sucesso antes da CI.

O `semantic:report` gera `reports/composition-analysis/semantic-knowledge.json`, um artefato derivado e não versionado nesta entrega. A CI é a fonte da execução do relatório; nenhuma aprovação funcional pode ser inferida do JSON.

**Fronteira negativa de diff:** não alterar `pi-catalog/`, `src/ui-catalog/contracts.lock.json`, `src/ui-catalog/catalog.ts`, `src/ui-catalog/extensions/catalog.ts`, schemas Zod, admissões ou permissões. **Pendências:** testes manuais/E2E de foco, teclado, responsividade e fluxos remotos; revisão de admissões apenas mediante tarefa independente.

## Execução da CI comprovada (2026-10-27)

O [workflow de qualidade #40505542083](https://github.com/fernandosam/ui-contract-studio/actions/runs/40505542083), no commit `0a80a457f57d62c542e5a2b46f869a2285fde596`, concluiu **os quatro jobs com sucesso**:

- `semantic:check` — APROVADO; 23 overlays curados, com verificação literal de evidência.
- `semantic:report` — APROVADO; relatório consultivo gerado (não é admissão).
- `docs:check` — APROVADO; links e referências bilíngues conferidos.
- `test:offline` — APROVADO; **312/312 testes, zero falhas**, inclusive regressões T14 e testes T09–T13.
- `contracts:diff` — APROVADO; sem expansão não autorizada de contratos.
- Verificações de código/integração, lint, TypeScript, build, artefatos experimentais e validação Pi — APROVADAS.
- Navegador focado de admissão (desktop/mobile) — APROVADO; **30 testes Playwright**. [Artefato de evidência](https://github.com/fernandosam/ui-contract-studio/actions/runs/40505542083/artifacts/12735400601). **Não** equivale à suíte E2E completa, de execução manual.

A tentativa anterior, [#40505391970](https://github.com/fernandosam/ui-contract-studio/actions/runs/40505391970), falhou exclusivamente por manter 40 guias na expectativa de `tests/bilingual-docs.test.mjs` antes da inclusão do 41º par. O inventário foi corrigido e o run acima comprova o ajuste. Capacidades `runtime-review-required` continuam aguardando revisão manual/E2E específica.
