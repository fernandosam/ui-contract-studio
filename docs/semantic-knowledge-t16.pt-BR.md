[English](semantic-knowledge-t16.md) | [Português](semantic-knowledge-t16.pt-BR.md)

# T16 — Entrega 3 (P2): Collapsible, Carousel e Rating

**Revisão semântica:** 2026-10-27. Referência: [checklist T01](semantic-knowledge-checklist.pt-BR.md), `src/ui-catalog/knowledge/alert-dialog.json` e fontes ReUI oficiais [Collapsible](https://reui.io/components/collapsible), [Carousel](https://reui.io/components/carousel), [Rating](https://reui.io/components/rating).

## Matriz auditável

| Overlay | Estático / não implementado / runtime | Trechos de evidência | Integrações candidatas | FAQ | Testes derivados |
| --- | ---: | ---: | ---: | ---: | ---: |
| `collapsible.json` | 5 / 3 / 2 | 15 | 8 | 7 | 9 |
| `carousel.json` | 7 / 4 / 3 | 24 | 10 | 9 | 11 |
| `rating.json` | 7 / 4 / 3 | 20 | 10 | 10 | 11 |
| **Total** | **19 / 11 / 8** | **59** | **28** | **26** | **31** |

Os 59 trechos foram conferidos literalmente, em 2026-10-27, contra arquivos `src/` versionados no GitHub. Isso **não equivale a teste funcional, análise semântica de execução ou aprovação de novas APIs**. Cada overlay tem teste offline separado em `tests/semantic-t16-<componente>.test.mjs`: classificação, fonte/data, cobertura de lacunas, rejeição de evidência adulterada, não promoção automática e projeção consultiva para Pi.

## Fronteiras comprovadas pela leitura de código

- **Collapsible:** contrato `title/open/defaultOpen/disabled`, slot `default` e sinal `openChange`. O gatilho Base UI é construído com `render`; não há garantia de árvore navegável, sincronização de URL, animação nem persistência.
- **Carousel:** slides Pi de `title/description` (até 50), `orientation`, `loop`, `slidesPerView`, setas, dots e `ariaLabel`. Os exemplos ReUI com fotos, thumbnails, autoplay e APIs Embla não ampliam o item JSON. Os indicadores representam *scroll snaps*; o wrapper captura apenas ArrowLeft/ArrowRight, mesmo em orientação vertical.
- **Rating:** o renderer Pi usa botões e `aria-pressed`, suporta `step=0.5`, frações de exibição e `change` sem payload. O adaptador ReUI dos exemplos usa `div onClick` sem teclado. Essa divergência tem teste/manual-a11y derivado e proíbe presumir radio nativo ou envio de review.

## Testes e comandos obrigatórios

O workflow de qualidade `.github/workflows/quality.yml` executa no pull request:

```bash
npm run semantic:check
npm run semantic:report
npm run docs:check
npm run test:offline
```

**Status inicial da revisão:** 59/59 evidências literais encontradas no código versionado; validação estrutural de IDs, relações e cobertura dos casos derivados realizada durante a elaboração dos overlays. **A primeira execução de CI aprovou semantic:check e semantic:report; a suíte offline apontou necessidade do par documental inglês e ajuste do inventário de guias, corrigidos nesta revisão. A aprovação integral depende da conclusão do workflow de correção.** O relatório `reports/composition-analysis/semantic-knowledge.json` é derivado e ignorado no Git, não um manifesto de admissão.

## Escopo e segurança

Esta entrega modifica somente três overlays JSON, três testes offline por componente, este registro bilíngue de auditoria e a contagem explícita de guias no teste de documentação bilíngue. Não altera `catalog.ts`, `extensions/catalog.ts`, `contracts.lock.json`, schemas Zod, permissões Pi, `pi-catalog/`, admissão, componentes React ou ações de backend. Os estados `documented-not-implemented` têm testes `candidate-not-executable`; os estados `runtime-review-required` exigem navegador/leitor de tela e não são promovidos por prova textual. Integrações são candidatas `advisory-only`, sem permissão ou admissão implícita.
