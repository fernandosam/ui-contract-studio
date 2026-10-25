[English](official-component-visual-audit.md) | [Português](official-component-visual-audit.pt-BR.md)

# Comparação visual com exemplos oficiais shadcn/ui

O workflow manual [Bootstrap oficial e auditoria visual](../.github/workflows/bootstrap-visual.yml) captura exemplos renderizados da documentação shadcn/ui e as prévias locais mapeadas no Explorador de Primitivos.

## Escopo e fontes

- O **plano de instalação** `shadcn-plan.json` contém 50 primitivas planejadas/locais.
- O **inventário de comparação** `scripts/official-component-examples.json` define **38 exemplos oficiais** para captura. Os dois números descrevem propósitos diferentes e não devem ser tratados como divergência.
- Nem todas as primitivas possuem contrato Pi isolado. O inventário registra quais exemplos têm par local; **não invente pares** para os componentes sem contrato.

As antigas **Galerias 1 e 2** foram removidas do produto; relatórios e métodos relacionados aos antigos 64 cards do shadcn/create são **históricos**, não critérios operacionais atuais. A ReUI é uma biblioteca separada de exemplos React.

## Execução manual

Com dependências reais e navegador instalado:

~~~bash
npm run shadcn:official:capture
python3 -m pip install Pillow==11.3.0
npm run shadcn:official:compare -- --strict
~~~

O Playwright captura a referência oficial e a prévia local correspondente, quando existente, em desktop/mobile. Os artefatos de inspeção são publicados em `reports/official-components/`, incluindo `index.html` e `comparison.json`.

## Critério de interpretação

Capturas com tamanhos, fontes, conteúdos e estados diferentes geram diferenças numéricas **apenas diagnósticas**. A verificação de cobertura pode falhar por referência ausente, captura ausente ou erro de proveniência, mas **não comprova fidelidade pixel a pixel**. A aprovação visual exige fixtures equivalentes e revisão humana registrada.

Consulte [desenvolvimento](development.md), [componentes](components.md) e [revisão de composições](revisao-visual-shadcn.md).
