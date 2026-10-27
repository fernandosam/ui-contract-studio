# T08 — Validação integrada de conhecimento semântico

**Revisão:** 2026-10-27. **Modelo:** [AlertDialog e checklist T01](semantic-knowledge-checklist.pt-BR.md). **Escopo:** seis propostas individuais [T02](https://github.com/fernandosam/ui-contract-studio/pull/30), [T03](https://github.com/fernandosam/ui-contract-studio/pull/31), [T04](https://github.com/fernandosam/ui-contract-studio/pull/32), [T05](https://github.com/fernandosam/ui-contract-studio/pull/33), [T06](https://github.com/fernandosam/ui-contract-studio/pull/34) e [T07](https://github.com/fernandosam/ui-contract-studio/pull/35), todas ainda não mescladas à main quando começou a T08. Esta branch incorpora os seis overlays e consolida seus testes para revisão integrada.

## Inventário e auditoria

| Componente | Capacidade estática / não implementada / runtime | Evidências de código | Integrações candidatas | FAQ | Testes derivados | Revisão da fonte |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Dialog | 5 / 3 / 3 | 13 | 11 | 8 | 10 | 2026-10-26 |
| DropdownMenu | 9 / 5 / 3 | 17 | 7 | 8 | 9 | 2026-10-26 |
| Popover | 5 / 4 / 4 | 16 | 12 | 8 | 9 | 2026-10-26 |
| Select | 9 / 6 / 4 | 29 | 12 | 10 | 13 | 2026-10-26 |
| Accordion | 7 / 3 / 2 | 15 | 9 | 9 | 12 | 2026-10-26 |
| Button | 8 / 3 / 2 | 18 | 10 | 8 | 9 | 2026-10-27 |
| **Total** | **43 / 24 / 18** | **108** | **61** | **51** | **62** | — |

**Auditoria estática de 2026-10-27:** 108/108 pares de evidência literal `path` e `contains` encontrados nos arquivos versionados do projeto; nenhuma evidência textual ausente. Todos os overlays possuem identidade, finalidade, justificativa, quando usar/evitar, notas para IA, estados separados por implementação, FAQ decisória, integrações candidatas, testes derivados e origem com data. As 24 capacidades não implementadas aparecem em casos `candidate-not-executable`; as 18 dependentes de runtime são cobertas por casos visuais, de integração ou de acessibilidade. A evidência estática não certifica comportamento em execução.

**Fontes oficiais:** [ReUI Dialog](https://reui.io/components/dialog), [DropdownMenu](https://reui.io/components/dropdown-menu), [Popover](https://reui.io/components/popover), [Select](https://reui.io/components/select), [Accordion](https://reui.io/components/accordion), [Button](https://reui.io/components/button). Revisões individuais em `source.reviewedOn`. O projeto instala Base UI; exemplos Radix são documentação de referência, não prova de props do contrato.

## Regressões e correções de integração

- Consolidada a cobertura específica de Dialog (T02), DropdownMenu (T03), Popover (T04), Select (T05) e Button (T07) no teste comum `tests/semantic-knowledge.test.mjs`; a cobertura do Accordion (T06) passa pelo teste integrado explícito de fronteiras de onboarding/SSR, estado e testes derivados.
- Removidas as suposições frágeis de exatamente **1 ou 2** overlays para permitir a integração simultânea e futuras extensões; o teste transversal garante a presença dos **7 atuais**.
- Acrescentados testes de 108 provas em código, inventário de estados/FAQ/integrações, vínculo de todos os IDs, fontes e datas, projeção consultiva para agentes, bloqueio de props/capacidades não implementadas e rejeição deliberada de evidências falsas para cada um dos seis componentes.

## Execução e rastreabilidade

O job **Source, docs and offline tests** do workflow `.github/workflows/quality.yml` passou a executar explicitamente:

```bash
npm run semantic:check
npm run semantic:report
npm run docs:check
npm run test:offline
```

O job **Source checks, schemas and production build** mantém `npm run check`, `npm run lint`, testes de integração e `npm run build`. O relatório em `reports/composition-analysis/semantic-knowledge.json` é gerado e consultivo; não é fonte de verdade ou manifesto de permissões.

**Registro verificável até a abertura do PR:** auditoria estática do repositório via conector GitHub: **108/108 evidências existentes**. Os comandos npm têm seu status associado aos logs da CI do PR, não a esta conferência estática. Preencher os resultados efetivos após conclusão dos jobs, sem presumir sucesso.

## Limites e pendências

- Esta entrega **não modifica** `src/ui-catalog/catalog.ts`, `src/ui-catalog/extensions/catalog.ts`, schemas Zod, `pi-catalog/`, allowlists, admission engine, permissões, contratos ou componentes React.
- `implemented-static-evidence` demonstra trecho de código, não teste funcional; `documented-not-implemented` permanece recomendação, nunca prop ou autorização; `runtime-review-required` requer E2E, foco, teclado, leitor de tela e viewport quando aplicável.
- Integrações têm `admission: advisory-only` no relatório e `not-granted` no conselho Pi. Qualquer execução remota, navegação, persistência ou promoção exige fluxo e revisão de implementação próprios. A validação integrada não substitui homologação E2E.
