[English](estilos-e-npm-v023.md) | [Português](estilos-e-npm-v023.pt-BR.md)

> **Registro histórico (v0.23):** o resultado de DNS/npm descreve o ambiente usado na auditoria e não comprova o estado de instalações ou CI atuais. Consulte [desenvolvimento](development.pt-BR.md).

# Auditoria CSS e registries — v0.23

## Arquivos atuais

Não há `application.css` no projeto. A folha central do Tailwind/shadcn é `src/globals.css` (indicada em `components.json`); os estilos próprios ficam em `src/index.css`. A comparação segue o padrão Tailwind 4/shadcn de tokens CSS semânticos (`:root` + modo escuro, `@theme inline`, `@layer base`). Mantivemos `.dark-theme` porque os mecanismos de tema e testes existentes dependem desse seletor; não há necessidade de renomeá-lo para `.dark` e migrar tudo apenas por estética.

## O que saiu

- Definições de breakpoints e espaçamento idênticas aos defaults Tailwind v4; fontes duplicadas em blocos claro/escuro; variáveis de sombra desnecessárias.
- Reset global de código, bloco pre, scrollbar invisível, botão `cursor: pointer`, body relativo em todo o site, declarações `box-sizing` duplicadas.
- Estilos não utilizados do shell antigo, sidebar, badges, card genérico, botões, formulário, modais e vitrines anteriores ao shadcn. Estes estilos competiam com as primitivas oficiais.

## O que permanece

Paleta customizada OKLCH de claro/escuro, variáveis semânticas, raio e sombras diferenciados; `@theme inline` e os adaptadores customizados da API declarativa: Stack/Grid, Heading/Text, Chart, Metric, Rating, campos e Pagination. Não alteramos schemas, templates, contratos, dados, estrutura de galerias nem layouts de cards oficiais. Em uma execução conectada, compare capturas das 64 galerias antes/depois nas mesmas fontes e viewports.

## Resultados executados nesta sandbox

`node sandbox/registry-probe.mjs` tentou três registries npm HTTPS. Todos falharam por DNS/tempo limite. Sem pacotes no cache, não houve `npm install`, `tsc`, build do Vite ou renderização em Playwright. Os testes `npm run test:offline` e verificações sem dependências são executáveis e devem ser repetidos após alterações. Veja `reports/sandbox/npm-registry-probe.json` para os erros e `sandbox/README.md` para as alternativas de rede.

**Não alegar fidelidade visual** antes das capturas reais com dependências oficiais e comparação com previews do shadcn.
