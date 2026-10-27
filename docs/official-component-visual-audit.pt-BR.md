[English](official-component-visual-audit.md) | [Português](official-component-visual-audit.pt-BR.md)

# Comparação visual com exemplos oficiais shadcn/ui

O novo workflow manual [Auditoria visual oficial](../.github/workflows/official-visual-manual.yml) é dedicado à auditoria visual (sem duplicar os testes funcionais E2E de [E2E manual](../.github/workflows/e2e-manual.yml)) e captura exemplos renderizados da documentação shadcn/ui e as prévias locais mapeadas no Explorador de Primitivos.

O workflow de [Bootstrap e auditoria visual](../.github/workflows/bootstrap-visual.yml) permanece para quando houver necessidade explícita de reinstalar primitivas; a auditoria independente não reinstala componentes nem altera arquivos-fonte.

## Escopo e fontes

- O **plano de instalação** `shadcn-plan.json` contém 50 primitivas planejadas/locais.
- O **inventário de comparação** `scripts/official-component-examples.json` seleciona **38 exemplos oficiais**: 29 com contrato Pi local e 9 apenas como referência oficial. As **12 primitivas restantes** estão explicitamente marcadas como **pendentes de revisão visual**, sem certificação implícita.
- Todas as 50 primitivas devem estar classificadas como selecionadas ou pendentes com justificativa. O piso de 38 referências não pode ser reduzido silenciosamente.
- Pendentes: `aspect-ratio`, `kbd`, `empty`, `scroll-area`, `alert-dialog`, `attachment`, `bubble`, `context-menu`, `hover-card`, `item`, `marker`, `message`.
- Nem todas as primitivas possuem contrato Pi isolado. O inventário registra quais exemplos têm par local; **não invente pares** para os componentes sem contrato.

As antigas **Galerias 1 e 2** foram removidas do produto; relatórios e métodos relacionados aos antigos 64 cards do shadcn/create são **históricos**, não critérios operacionais atuais. A ReUI é uma biblioteca separada de exemplos React.

## Execução manual

Com dependências reais e navegador instalado:

~~~bash
npm run shadcn:official:inventory:check
npm run shadcn:official:capture
python3 -m pip install Pillow==11.3.0
npm run shadcn:official:compare -- --strict
~~~

O Playwright captura a referência oficial e a prévia local correspondente, quando existente, em desktop/mobile. Os artefatos de inspeção são publicados em `reports/official-components/`, incluindo `index.html` e `comparison.json`.

## Critério de interpretação

Capturas com tamanhos, fontes, conteúdos e estados diferentes geram diferenças numéricas **apenas diagnósticas**. A verificação de cobertura falha por referência ou captura ausente, origem inválida, mapeamento Pi incorreto, duplicidade ou primitiva sem classificação. **Não comprova fidelidade pixel a pixel e não certifica as 12 primitivas pendentes.** A aprovação visual exige fixtures equivalentes e revisão humana registrada.

Consulte [desenvolvimento](development.pt-BR.md), [componentes](components.pt-BR.md) e [revisão de composições](revisao-visual-shadcn.pt-BR.md).
