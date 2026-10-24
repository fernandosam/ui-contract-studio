# Componentes compostos shadcn/create — v0.12

A galeria oficial do shadcn/create contém dois blocos (`preview` com 31 cards e `preview-02` com 33 cards). A implementação no `ui-contract-studio` possui **64 componentes compostos individuais**, todos disponíveis no catálogo fechado.

## Arquitetura

- **Tela:** `src/ui-screens/exemplo-01.json` ou `exemplo-02.json` referencia somente os tipos compostos.
- **Contrato:** `src/ui-catalog/extensions/catalog.ts` descreve, com Zod estrito, texto de título e descrição e somente opções aplicáveis ao card (`metricValue`, `primaryActionLabel`, `inputValue`, `chartTitle`).
- **React:** `src/ui-catalog/extensions/components/<nome>.tsx` exporta um componente próprio para cada card.
- **Template de composição:** `src/ui-catalog/extensions/composites/templates/<nome>.json` encapsula a árvore original de componentes base aprovados; não permite HTML nem JSX de entrada.
- **Registry:** `src/ui-catalog/extensions/registry.tsx` mapeia os 64 nomes aos React components, preservando `DataTable`, `DatePicker`, `Field`.
- **Origem:** `src/ui-catalog/create-preview-inventory.json` e `src/ui-catalog/sources.json` associam cada entrada ao arquivo original do shadcn/ui (Base UI).
- **Versionamento:** `src/ui-catalog/contracts.lock.json` registra versão e hash individual; atualizações exigem revisão de contrato.

Os templates são **adaptações demonstrativas** do inventário `shadcn/create`, não reprodução literal dos originais. Algumas funcionalidades (ex.: upload real, áudio, dados financeiros, QR, pagamentos) permanecem como demonstração sem integração com recursos externos.

## Modificar um card

1. Verifique o componente e a primitiva oficial em https://ui.shadcn.com/docs/components, assim como o `sourcePath` no inventário.
2. Altere a composição específica em `composites/templates/`; mantenha apenas tipos registrados.
3. Se necessário, atualize as props estritas em `extensions/catalog.ts`, a implementação React e a versão/hash no lock; documente a revisão.
4. Execute `npm run composites:check`, `npm run contracts:check`, `npm run examples:check`, `npm run validate` e `npm run build`.
5. Valide as interações no navegador e revise a acessibilidade antes da aprovação final.

**Restrições:** não adicione classes, callbacks, URLs arbitrárias, JSX, HTML ou importações diretas de componentes nas telas JSON.

## Limitações de validação

A criação estrutural, hashes e testes offline podem ser conferidos sem npm. A homologação de shadcn/ui real, o build com dependências completas e Playwright exigem os arquivos oficiais instalados e ambiente conectado.
