[English](semantic-knowledge-t17.md) | [Português](semantic-knowledge-t17.pt-BR.md)

# T17 — Entrega 3 (P2): Alert, Card, Textarea e Progress

**Revisão documental:** 2026-10-27. Modelo: [checklist T01](semantic-knowledge-checklist.pt-BR.md) e `src/ui-catalog/knowledge/alert-dialog.json`. Fontes ReUI oficiais: [Alert](https://reui.io/components/alert), [Card](https://reui.io/components/card), [Textarea](https://reui.io/components/textarea), [Progress](https://reui.io/components/progress).

## Matriz de evidências e escopo

| Overlay | Estático / não implementado / revisão em runtime | Trechos literais | Integrações candidatas | FAQ | Casos derivados |
| --- | ---: | ---: | ---: | ---: | ---: |
| `alert.json` | 5 / 3 / 2 | 12 | 8 | 7 | 8 |
| `card.json` | 4 / 4 / 2 | 13 | 9 | 7 | 8 |
| `textarea.json` | 6 / 3 / 2 | 20 | 8 | 7 | 9 |
| `progress.json` | 5 / 4 / 2 | 14 | 8 | 8 | 10 |
| **Total** | **20 / 14 / 8** | **59** | **33** | **29** | **35** |

Todos os trechos de evidência estática foram conferidos literalmente contra arquivos `src/` versionados obtidos do GitHub durante a elaboração. **A presença textual não comprova comportamento em execução, admissão Pi, autorização de backend, certificação visual ou E2E real.** Cada overlay tem seu teste `tests/semantic-t17-<slug>.test.mjs` independente (4 casos offline por arquivo). Os testes verificam estrutura T01, evidências exatas, classificação, referências a capacidades, rejeição de evidências falsas e projeção consultiva para Pi.

## Limites encontrados no código

- **Alert:** Pi admite título/descrição, visual default/destructive, ícones por tom e fechamento local. A primitiva instalada usa sempre `role="alert"`, inclusive para avisos não urgentes. O Pi não expõe `role="status"`, `AlertAction` nem retry remoto; o fechamento apenas desmonta estado local. Anúncios e mobile requerem revisão real.
- **Card:** Pi admite cabeçalho/descrição/rodapé textuais, slot default, tamanho, largura e centralização. `CardAction` só existe na primitiva React. Cartão inteiro clicável, mídia rica e ações estruturadas no footer não foram admitidos. Densidade e teclado dependem de browser.
- **Textarea:** Pi admite nome/rótulo, ajuda, maxLength nativo, rows, change local e estados disabled/required/readOnly/invalid. A extensão `CharacterCountTextarea` é separada e não habilita contador no Textarea Pi. O CSS `field-sizing-content` pode prevalecer sobre rows, em especial no Chromium. Altura, anúncios de erro e texto longo exigem revisão.
- **Progress:** Pi exige `value` numérico (0..100), aceita `max` positivo, cinco tons e exibe contagem valor/max. A barra recebe percentual normalizado e limitado; `value>max` pode produzir divergência entre contagem e preenchimento. Subpartes Label/Value existem em React, não no adaptador Pi. Sem admissão para indeterminado, upload, ETA ou pausa/cancelamento.

## Validação

O PR dispara o workflow de qualidade `.github/workflows/quality.yml`, com:

```bash
npm run semantic:check
npm run semantic:report
npm run docs:check
npm run test:offline
```

**Na elaboração:** 59 evidências textuais conferidas contra código do GitHub e 16 casos offline novos adicionados ao PR. Registrar aprovação integral **somente após resultado real da CI**. O relatório derivado `reports/composition-analysis/semantic-knowledge.json` é ignorado no Git e não autoriza contratos.

## Fronteira de escopo

O diff T17 contém quatro overlays JSON, quatro testes offline independentes, este registro bilíngue, índices da documentação e a contagem de guias bilíngues. Nenhuma mudança em `catalog.ts`, `extensions/catalog.ts`, schemas Zod, `contracts.lock.json`, `pi-catalog/`, admissão, React runtime ou permissões Pi. Capacidades candidatas continuam não implementadas e revisão em runtime permanece pendente.
