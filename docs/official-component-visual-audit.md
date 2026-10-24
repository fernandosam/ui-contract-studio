# Comparação visual com exemplos oficiais shadcn/ui

O job **Bootstrap oficial e auditoria visual** captura os exemplos renderizados na
[documentação Base UI](https://ui.shadcn.com/docs/components) e a prévia de cada
componente correspondente no **Explorador de Primitivos shadcn**.

## Duas auditorias distintas

1. **Componentes oficiais**: `scripts/official-component-examples.json` associa
   os 38 componentes de `shadcn-plan.json` ao primeiro `ComponentPreview` dos
   arquivos MDX oficiais `apps/v4/content/docs/components/base/*.mdx`.
   `Sidebar` é uma prévia de bloco; `Drawer` usa o estilo `base-rhea`.
   As capturas oficiais em desktop e mobile são geradas pelo Playwright,
   com screenshot local apenas quando há contrato próprio correspondente no
   catálogo. Nove componentes instalados ainda não têm esse contrato; ficam
   explicitamente marcados como referência oficial sem par local.
2. **Galerias 1 e 2**: são 64 cards extraídos dos blocos
   `apps/v4/registry/bases/base/blocks/preview*/cards` do **shadcn/create**.
   Eles **não são** as demos individuais da documentação. A comparação
   pixel a pixel destes cards continua separada, em
   `reports/gallery-fidelity/`, até serem obtidas referências dos **mesmos**
   cards, no mesmo tema, layout e estado.

## Execução

Após `npm ci` e `npx playwright install chromium` (ou Chrome do runner):

```bash
npm run shadcn:official:capture
python3 -m pip install Pillow==11.3.0
npm run shadcn:official:compare -- --strict
```

A primeira etapa visita o site oficial real com o navegador e captura o
`data-slot="component-preview"` inicial (ou a prévia do bloco Sidebar), depois
visita o Explorer local e captura `data-testid="catalog-live-preview"`.
A cobertura esperada é **38 × 2 = 76 capturas oficiais**, das quais
**29 × 2 = 58 pares locais comparáveis**. Os 18 casos restantes não são
considerados pares artificiais. Falta de referência oficial, amostra de um
componente mapeado ou registro de proveniência reprova o gate do bootstrap. Os artefatos
`reports/official-components/index.html`, `comparison.json` e respectivas
imagens são disponibilizados no GitHub Actions.

## Limites e interpretação

Exemplos oficiais e exemplos do catálogo podem ter **dados, estados, composição,
tamanho e fonte diferentes**. O relatório inclui diferença visual normalizada
somente para **diagnóstico** e revisão lado a lado; ela **não é uma pontuação
de fidelidade** nem autoriza declarar equivalência visual. Para uma aprovação
pixel a pixel são necessários fixtures e estados idênticos aos da fonte.
Mudanças no site oficial podem causar falha de captura, que deve ser investigada
sem substituir a imagem de referência por uma cópia local ou ignorar a falha.
