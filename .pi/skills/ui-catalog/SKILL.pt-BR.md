---
name: ui-catalog
description: Gerar telas JSON com catálogo json-render fechado, reaproveitar padrões e submeter extensões a revisão independente.
---

[English](SKILL.md) | [Português](SKILL.pt-BR.md)

# Skill UI Catalog

Siga as regras de [AGENTS.md](../../../AGENTS.pt-BR.md). Este documento é o procedimento operacional para o Pi; não substitui as políticas de contratos, segurança e revisão.

## Criar ou alterar uma tela

1. Leia `pi-catalog/contracts.json`, `src/ui-catalog/contracts.lock.json`, `pi-catalog/retired-contracts.json` e `src/ui-patterns/`. Reutilize tipos aprovados e padrões antes de propor novidades.
2. Selecione o contexto necessário: `npm run pi:zod-schema` e `npm run pi:context -- --types=Card,Button --stdout` (até 25 tipos). Consulte os exemplos em `pi-catalog/examples/`. Não use `--metadata-only` para geração.
3. Gere **apenas** `src/ui-screens/<slug>.json` e `src/ui-screen-meta/<slug>.json`; use os schemas Zod, props canônicas, slots, eventos e ações aprovadas. Não copie JSX de templates e não use URLs ou callbacks livres.
4. Para compostos, altere somente `content` e `nodeProps` com chaves declaradas no contexto; preserve a árvore, os nomes de campos, o tipo de nó, ações e links.
5. Execute `npm run pi:validate -- --file=<spec.json>`, corrija `issues[].pointer`, então rode `npm run patterns:check && npm run check:catalog && npm run validate && npm run build` quando disponível. Informe bloqueios e validações realmente realizadas.

## Expandir o catálogo

- A inclusão exige uma lacuna funcional demonstrável e **admissão com schema Zod + componente React + registry**, provenance/licença em `sources.json`, versão e fingerprint em `contracts.lock.json`, testes e aprovação independente.
- Para composições declarativas estáticas, edite o template/manifesto e execute `npm run composites:generate`; nunca edite `src/ui-catalog/extensions/generated/`. Para estado ou eventos próprios, use React e adapter tipado.
- shadcn/ui e ReUI são fontes de implementação e exemplos, **não** concessões de acesso ao catálogo Pi. Consulte [componentes](../../../docs/components.pt-BR.md) e os inventários de origem.
- Não altere o shell, tokens ou schemas-base apenas por diferença estética.

## Dados, testes e evidências

- DataTable aceita somente `sourceId` autorizado. O endpoint demonstrativo `processos-api` não inclui SSO/autorização; essas garantias pertencem ao backend.
- Faça `npm run test:offline` e os checks afetados; `npm run verify` executa validação, build e navegador em ambiente completo. E2E no GitHub é manual na `main`.
- Testes visuais só são homologados com referências, screenshots locais e revisão humana. Não marque execução ou aprovação sem evidência.
- Avaliação real do Pi é manual, com `PI_EVAL_CONFIRM=yes` e, para reparo pago, `PI_EVAL_REPAIR_CONFIRM=yes`. Não substitua resultados ausentes por dados sintéticos.

Veja [fluxo do Pi](../../../docs/pi-workflow.pt-BR.md), [qualidade](../../../docs/development.pt-BR.md) e [governança](../../../docs/governance.pt-BR.md).
