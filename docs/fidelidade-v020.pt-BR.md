[English](fidelidade-v020.md) | [Português](fidelidade-v020.pt-BR.md)

> **Registro histórico (v0.20):** números, lacunas e estado de homologação refletem o snapshot auditado, não necessariamente a versão atual. Consulte [arquitetura](architecture.pt-BR.md) e [revisão visual vigente](revisao-visual-shadcn.pt-BR.md).

# Revisão de composições e configuração de dados — v0.20

## Escopo e evidências

Foram cruzados **118 componentes compostos** já presentes na v0.19:

- 64 cards de `apps/v4/registry/bases/base/blocks/preview` e `preview-02` (revisão de código já documentada em `create-reference-audit.json`);
- 27 blocos (dashboard, login, signup e sidebars), derivados de 103 arquivos e 27 previews (`block-source-inventory.json`);
- 27 composições do portal `apps/v4/components` (22 declarativas e 5 com estado), descritas em `site-compositions-audit.json`.

**O que foi realmente verificado:** inventários e referências dos TSX, exemplos anteriores, presença dos elementos nos templates, rótulos publicados e páginas de preview HTML verificáveis; correção da apresentação de Activity Goal com barras, default de Cookie Settings mais próximo do original, e visualização de mensagens no Sidebar09. Os 118 componentes receberam análise automatizada com vínculos à origem e discrepâncias registradas em `src/ui-catalog/composite-fidelity-audit.json`; **41 têm divergências de rótulos identificadas heuristicamente**, que precisam de avaliação manual porque podem representar diferenças legítimas de layout ou localização.

**O que NÃO foi verificado:** não foram capturadas e comparadas lado a lado as 118 implementações locais com screenshots originais, em tema claro/escuro e desktop/mobile. A auditoria marca os 118 como **pendentes**. Não se afirma pixel-perfect; componentes como QR, visualizadores, grids e gráficos avançados permanecem adaptações e podem exigir novas primitivas aprovadas.

## Flexibilidade tipada por nó

Os 113 compostos declarativos agora têm `nodeProps`, campo gerado de cada template em `src/ui-catalog/extensions/composites/generated-node-props.ts`, com schema Zod `.strict()` específico. São **2.293 propriedades expostas**, incluindo **81 arrays/objetos** (séries de gráficos, linhas de tabelas, seções da sidebar, opções etc.). O `content` textual antigo continua aceito.

Exemplo — Dashboard01:

```json
{
  "root": "main",
  "elements": {
    "main": {
      "type": "Dashboard01",
      "props": {
        "title": "Painel personalizado",
        "nodeProps": {
          "b008": { "data": [{ "label": "Jan", "value": 28 }, { "label": "Feb", "value": 35 }] },
          "b009": { "rows": [["Overview", "Report", "Done", "8", "4", "Reviewer"]] },
          "b002": { "sections": [{ "label": "Projetos", "items": ["Em andamento", "Arquivados"] }] }
        }
      },
      "children": []
    }
  }
}
```

Propriedades protegidas: não é possível substituir `type`, `children`, `on`, a identidade dos campos (`name`) ou links/URLs externos (`href`, `src`, `sourceId`). A camada pública Zod rejeita chaves de `nodeProps` desconhecidas; o template compilado é validado de novo pelo `catalog.validate()` antes de renderizar. As estruturas de dados podem ser alteradas **somente dentro dos limites dos contratos das primitivas** (p.ex., colunas/linhas válidas e gráficos com pelo menos um ponto).

Os cinco componentes stateful continuam tendo APIs semânticas próprias. `SiteCardsActivityGoal` recebe `chartValues`, `goal`, `minimum`, `maximum`, `step` e `showBarChart`; Cookie Settings aceita `showOptionalCookies` e switches opcionais. Não há envio remoto, escrita de cookies ou autorização real.

## Fluxo de verificação

```bash
npm run composites:node-props:check
npm run composites:generated:check
npm run composites:fidelity
npm run test:offline
# No WSL, após instalar dependências:
npm run pi:zod-schema
npm run validate
npm run build
npm run composites:capture
npm run composites:compare
```

Para a captura referencial, visite as URLs da auditoria e salve as imagens em `reports/composite-fidelity/reference/<Tipo>.png`. O Playwright gera as capturas locais de desktop em `reports/composite-fidelity/local/<Tipo>.png` e de mobile em `local/mobile/`. Compare no arquivo `reports/composite-fidelity/compare.html`. Após inspeção efetiva e com comentários, inclua em `src/ui-catalog/composite-visual-approvals.json` nome, revisor, data, observações e status `approved` para cada composição. `npm run composites:fidelity:strict` **não passa** enquanto houver itens pendentes ou evidências ausentes.

Sem `node_modules` e componentes shadcn locais, os testes offline verificam estrutura, integridade, exemplos e compilador puro, **não** certificam TypeScript completo, React no navegador ou semelhança exata com o preview.
