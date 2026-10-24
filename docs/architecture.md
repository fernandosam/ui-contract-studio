# Arquitetura enxuta — v0.19

## Fonte de verdade

- **156 contratos**: Zod em `src/ui-catalog/catalog.ts` e `src/ui-catalog/extensions/catalog.ts`; versões e status revisados em `contracts.lock.json` e `sources.json`.
- **41 tipos base**: renderers em `src/ui-catalog/components/playground.tsx` (não são editáveis pelo Pi).
- **23 implementações TSX não geradas** em `src/ui-catalog/extensions/components/`, incluindo DataTable, DatePicker, Field, BlockSidebar, NotificationSettings, cinco widgets stateful e doze adaptadores de primitivas oficiais.
- **91 templates aprovados**: árvores JSON versionadas em `src/ui-catalog/extensions/composites/templates/`.
- **Fábrica/gerador**: `generated-manifest.json` lista nomes, templates e slots especiais; `scripts/generate-composite-registry.mjs` escreve `src/ui-catalog/extensions/generated/composite-implementations.tsx`. Nunca edite o arquivo gerado.
- **Registry circular eliminado**: `SpecScreen` fornece o registry por `CompositeRegistryContext`; `ApprovedCardComposition` só consome contexto e valida a árvore compilada pelo helper puro `compile-composition.mjs`.

## Mudanças de composição

Altere o template revisado e, se necessário, suas props estritas em Zod; atualize hashes com revisão humana. Se adicionar/remover uma composição, altere o manifesto e gere o código novamente. **Não adicione JSX arbitrário, eventos livres ou callbacks ao JSON**.

Os `pi-catalog/examples/*.json` são os exemplos canônicos compartilhados pelo Pi e pelo Explorador. São produzidos a partir de templates, telas, padrões e amostras isoladas revisadas através de `pi:fixtures`. Não altere o resultado gerado diretamente; edite a origem e execute o gerador.

## Fingerprints

- `fingerprint`: SHA-256 textual legado, mantido para compatibilidade com versões antigas.
- `semanticFingerprint`: SHA-256 de tokens de contrato sem espaços/comentários irrelevantes, preservando strings e operadores. Novos PRs devem ser comparados semanticamente quando ambos os lados suportarem o campo; mudanças de schema exigem revisão e incremento de versão.
