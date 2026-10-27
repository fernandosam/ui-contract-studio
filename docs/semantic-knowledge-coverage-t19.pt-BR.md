[English](semantic-knowledge-coverage-t19.md) | [Português](semantic-knowledge-coverage-t19.pt-BR.md)

# T19 — Matriz de cobertura semântica das 31 famílias ReUI

**Revisão:** 2026-10-27. **Escopo:** somente os exemplos ReUI versionados e o conhecimento semântico existente, sem admissão de contratos. **Referência:** [checklist T01](semantic-knowledge-checklist.pt-BR.md) e `src/ui-catalog/knowledge/alert-dialog.json`.

## Reconciliação do inventário

- **31 famílias / 559 exemplos**: valores derivados de `src/ui-catalog/reui-primitive-source-baseline.json` (559 entradas) e confrontados com as chaves de `src/ui-catalog/reui-guidance.json`.
- **39 registros curados**: os 31 overlays das famílias ReUI **mais oito registros diferentes, fora dessas 31 famílias**: `AlertDialog` (referência preexistente), `Combobox`, `Command`, `DataTable`, `DatePicker`, `Field`, `Radio` e `Sheet`.
- **Atenção à diferença de contagem:** antes de integrar as entregas T17 e T18, a `main` tinha 30 arquivos em `knowledge/`, cobrindo 22 famílias ReUI + os mesmos oito extras. As PRs [#76 (T17)](https://github.com/fernandosam/ui-contract-studio/pull/76) e [#77 (T18)](https://github.com/fernandosam/ui-contract-studio/pull/77) acrescentaram os nove overlays restantes e foram integradas em 2026-10-27. Não se criaram famílias para fechar a conta.
- **444 capacidades documentadas:** 230 com evidência estática de implementação (**E**), 126 somente documentadas/não implementadas (**D**) e 88 que exigem revisão em runtime (**R**). Existem **315 casos de teste derivados** descritos, não 315 execuções comprovadas. A matriz abaixo separa as 31 famílias (356 capacidades, 257 casos) dos oito registros adicionais (88 capacidades, 58 casos).

## Matriz auditada das 31 famílias

E/D/R = `implemented-static-evidence` / `documented-not-implemented` / `runtime-review-required`. Os testes são **especificações derivadas**, não certificados E2E.

| Família / overlay | Exemplos | E/D/R | Testes derivados |
| --- | ---: | ---: | ---: |
| [Accordion](../src/ui-catalog/knowledge/accordion.json) | 11 | 7/3/2 | 12 |
| [Alert](../src/ui-catalog/knowledge/alert.json) | 20 | 5/3/2 | 8 |
| [Avatar](../src/ui-catalog/knowledge/avatar.json) | 35 | 4/2/2 | 5 |
| [Badge](../src/ui-catalog/knowledge/badge.json) | 25 | 4/2/2 | 5 |
| [Button](../src/ui-catalog/knowledge/button.json) | 61 | 8/3/2 | 9 |
| [ButtonGroup](../src/ui-catalog/knowledge/button-group.json) | 57 | 5/3/2 | 6 |
| [Card](../src/ui-catalog/knowledge/card.json) | 18 | 4/4/2 | 8 |
| [Carousel](../src/ui-catalog/knowledge/carousel.json) | 11 | 7/4/3 | 11 |
| [Checkbox](../src/ui-catalog/knowledge/checkbox.json) | 22 | 6/3/2 | 9 |
| [Collapsible](../src/ui-catalog/knowledge/collapsible.json) | 10 | 5/3/2 | 9 |
| [Dialog](../src/ui-catalog/knowledge/dialog.json) | 10 | 5/3/3 | 10 |
| [Drawer](../src/ui-catalog/knowledge/drawer.json) | 5 | 4/5/2 | 7 |
| [DropdownMenu](../src/ui-catalog/knowledge/dropdown-menu.json) | 18 | 9/5/3 | 10 |
| [Input](../src/ui-catalog/knowledge/input.json) | 31 | 7/3/2 | 9 |
| [Pagination](../src/ui-catalog/knowledge/pagination.json) | 15 | 7/3/2 | 8 |
| [Popover](../src/ui-catalog/knowledge/popover.json) | 11 | 5/4/4 | 9 |
| [Progress](../src/ui-catalog/knowledge/progress.json) | 8 | 5/4/2 | 10 |
| [RadioGroup](../src/ui-catalog/knowledge/radio-group.json) | 17 | 6/3/2 | 9 |
| [Rating](../src/ui-catalog/knowledge/rating.json) | 9 | 7/4/3 | 11 |
| [Select](../src/ui-catalog/knowledge/select.json) | 33 | 9/6/4 | 13 |
| [Separator](../src/ui-catalog/knowledge/separator.json) | 6 | 4/2/2 | 4 |
| [Skeleton](../src/ui-catalog/knowledge/skeleton.json) | 10 | 4/2/2 | 4 |
| [Slider](../src/ui-catalog/knowledge/slider.json) | 12 | 7/3/2 | 7 |
| [Spinner](../src/ui-catalog/knowledge/spinner.json) | 12 | 4/3/2 | 5 |
| [Switch](../src/ui-catalog/knowledge/switch.json) | 14 | 6/3/2 | 9 |
| [Table](../src/ui-catalog/knowledge/table.json) | 17 | 7/4/3 | 10 |
| [Tabs](../src/ui-catalog/knowledge/tabs.json) | 9 | 6/3/3 | 9 |
| [Textarea](../src/ui-catalog/knowledge/textarea.json) | 6 | 6/3/2 | 9 |
| [Toggle](../src/ui-catalog/knowledge/toggle.json) | 14 | 6/3/2 | 7 |
| [ToggleGroup](../src/ui-catalog/knowledge/toggle-group.json) | 16 | 7/4/2 | 9 |
| [Tooltip](../src/ui-catalog/knowledge/tooltip.json) | 16 | 5/3/2 | 6 |
| **Total ReUI** | **559** | **181/103/72** | **257** |

## Registros adicionais — não ampliar o inventário ReUI

| Registro | E/D/R | Testes | Observação |
| --- | ---: | ---: | --- |
| [AlertDialog](../src/ui-catalog/knowledge/alert-dialog.json) | 5/2/2 | 6 | Modelo preexistente T01 |
| [Combobox](../src/ui-catalog/knowledge/combobox.json) | 5/2/2 | 8 | Candidato documental, sem admissão automática |
| [Command](../src/ui-catalog/knowledge/command.json) | 5/3/2 | 8 | Candidato documental, sem admissão automática |
| [DataTable](../src/ui-catalog/knowledge/data-table.json) | 10/4/2 | 9 | Contrato específico fora das 31 famílias |
| [DatePicker](../src/ui-catalog/knowledge/date-picker.json) | 8/4/2 | 7 | Contrato específico fora das 31 famílias |
| [Field](../src/ui-catalog/knowledge/field.json) | 5/3/2 | 6 | Contrato específico fora das 31 famílias |
| [Radio](../src/ui-catalog/knowledge/radio.json) | 6/3/2 | 7 | Distinto da família de exemplos `RadioGroup` |
| [Sheet](../src/ui-catalog/knowledge/sheet.json) | 5/2/2 | 7 | Candidato documental, sem admissão automática |
| **Total adicional** | **49/23/16** | **58** | **8 registros** |

## Checklist T01, lacunas e fronteira de autoridade

A auditoria verificou em **cada um dos 39 registros**: identidade e fonte oficial com seções e data de revisão (26 ou 27/10/2026); finalidade; justificativa; quando usar e evitar; notas para agentes de IA; capacidades com os três estados previstos; evidências de código `src/` e trechos exatos quando implementadas; integrações candidatas; decisões de FAQ; requisitos de teste; testes derivados com IDs de capacidades existentes; e diferença entre curadoria, implementação e admissão. Todos os registros estão marcados `reviewed-documentation` — status **somente documental**.

**Lacuna corrigida na T19:** `DropdownMenu` possuía a capacidade `separators` com evidência estática, mas sem caso derivado vinculado. Foi acrescentado o teste derivado `separator-groups-not-selectable`, exigindo separadores sem foco/seleção; ainda não equivale à execução desse teste de interação no navegador.

**Lacunas intencionalmente abertas:** as 126 capacidades `documented-not-implemented` não se tornam APIs; as 88 `runtime-review-required` continuam dependentes de validação real de teclado, foco, acessibilidade, responsividade e/ou interação. Integrações permanecem `advisory-only`; não houve modificação de schemas Zod, APIs admitidas, `contracts.lock.json`, `pi-catalog/` ou permissões Pi.

## Evidências reproduzíveis e validação

- `tests/semantic-coverage-t19.test.mjs`: regressão de inventário (31/559/39), correspondência de nomes, checklist de todos os overlays via `validateSemanticOverlay`, evidências textuais, cobertura de capacidades por testes derivados, candidatos não executáveis, limites de admissão e `buildSemanticKnowledge`.
- `npm run semantic:check`: exige consistência de overlays e evidências no código; `npm run semantic:report`: regenera `reports/composition-analysis/semantic-knowledge.json` como **artefato derivado**, não fonte de contrato.
- `node --test tests/semantic-coverage-t19.test.mjs`, `npm run test:offline` e `npm run docs:check`: complementam a verificação estática. Resultados observados devem ser consultados na CI do PR da T19; não confundir sucesso de CI com certificação E2E.
- Para exemplos versionados, `npm run reui:audit:check` verifica a base estática separadamente; `tests/e2e/reui-gallery-full.spec.ts` é execução manual e não é certificada por esta T19.

**Critério de pronto:** 31 famílias vinculadas a 31 overlays; oito registros extras explicados; nenhum registro sem seção do checklist; capacidades documentadas vinculadas a teste derivado; `semantic:check` e `semantic:report` aprovados pela CI, sem ampliação automática de contrato.
