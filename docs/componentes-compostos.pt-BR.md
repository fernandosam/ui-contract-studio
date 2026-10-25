[English](componentes-compostos.md) | [Português](componentes-compostos.pt-BR.md)

# Componentes compostos ativos

O projeto mantém **37 composições declarativas geradas**, incluindo `Dashboard01`, `Login01..05`, `Signup01..05`, `Sidebar01..16` e 10 composições demonstrativas do site shadcn. Outros cinco compostos interativos possuem implementação própria.

A tela Dashboard foi removida da navegação, mas o **contrato e o template de `Dashboard01` permanecem disponíveis** em `src/ui-catalog/extensions/composites/templates/block-dashboard-01.json`, com Zod, manifesto, origem e exemplo Pi. Login, Cadastro e Sidebars continuam como blocos navegáveis.

As antigas Galerias 1 e 2 e seus 54 contratos específicos foram excluídos. A galeria **ReUI** permanece acessível em `/?screen=reui`, preservando 559 composições React e as respectivas orientações para agentes.

## Manutenção e validação

- Esquemas: `src/ui-catalog/extensions/catalog.ts`.
- Manifesto: `src/ui-catalog/extensions/composites/generated-manifest.json`.
- Contratos versionados: `src/ui-catalog/contracts.lock.json`.
- Templates: `src/ui-catalog/extensions/composites/templates/`.
- Composições geradas: `src/ui-catalog/extensions/generated/`.
- Validação: `npm run check`, `npm run validate` e `npm run build`.

Não admita JSX, HTML, URLs, callbacks ou ações arbitrárias dentro dos JSONs. Novas composições devem passar por auditoria de origem e revisão visual independente.
