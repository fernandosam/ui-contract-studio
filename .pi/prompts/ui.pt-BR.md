---
description: Criar tela JSON restrita aos contratos aprovados e padrões e exemplos da v0.12
argument-hint: '<descrição da interface>'
---

[English](ui.md) | [Português](ui.pt-BR.md)

Tarefa: $ARGUMENTS

Siga AGENTS.md e a skill ui-catalog. Primeiro pesquise os padrões aprovados em src/ui-patterns; selecione e adapte um deles se possível. Gere apenas JSON em src/ui-screens com metadados. Não modifique o shell, código React, tokens ou catálogo sem necessidade técnica e revisão independente. Verifique schemas, contratos e validações aplicáveis. Ao terminar, apresente as alterações e resultados efetivamente observados.

Se for indispensável um componente novo, interrompa a tarefa até realizar a admissão completa, com schema Zod, componente React, registry, manifesto, testes e revisão independente.

## API pública shadcn/ui — versão 0.9
- Para novos JSONs, utilize **somente** os nomes e props atuais de `src/ui-catalog/catalog.ts` e `src/ui-catalog/extensions/catalog.ts`.
- Os contratos aprovados têm versão semântica (base v2.0.0). Props antigas (`Button.variant=primary/danger`, `Badge.text`, `Alert.type/message`, `Dialog.openPath`) não são permitidas.
- Os componentes React devem delegar a primitivas shadcn/ui oficiais quando houver equivalente. Sem equivalente nativo, documentar a composição, sem anunciar API oficial inexistente.
- Para componentes compostos (`Card`, `Table`, `Tabs`, `DatePicker`, `DataTable`), expor apenas dados serializáveis, props compatíveis e eventos autorizados; **não** aceitar JSX/callbacks/HTML/className vindos de JSON.
- `shadcn-plan.json` determina dependências para instalação, **não** contratos aprovados.
- Migrações de contratos devem alterar schemas, registry, telas, padrões, exemplos, lock/fingerprints, documentação e testes em conjunto.

Referências de exemplos: use `/?screen=reui`, os padrões JSON aprovados e os exemplos de `pi-catalog/examples/`. As antigas galerias 1/2 não devem ser restauradas.


## Fluxo obrigatório Pi v0.18
1. Escolha até 25 tipos necessários a partir de `pi-catalog/contracts.json`.
2. `npm run pi:zod-schema` e `npm run pi:context -- --types=<tipos> --stdout`: use os schemas reais retornados.
3. Gere somente spec JSON com `root`, `elements` e `children: []` em todos os nós.
4. `npm run pi:validate -- --file=<spec.json>`; corrija os JSON Pointers. Não altere contratos nem scripts para contornar erros sem revisão.
5. A saída deve ser revisada antes de integrar na aplicação; teste visual e CI são etapas adicionais.
