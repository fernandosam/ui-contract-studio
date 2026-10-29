[English](structured-tree-operations.md) | [Português](structured-tree-operations.pt-BR.md)

# E08 — Operações estruturadas sobre a árvore JSON

**Status:** API interna v1, sem novas permissões Pi, execução externa ou persistência. Contratos de componentes, eventos e ações permanecem exclusivamente no catálogo Zod existente. Este protocolo edita specs `json-render` já válidas, sem criar um segundo schema de componentes.

## Formato do patch

Uma spec contém `root`, `elements` e opcionalmente `state`. Cada elemento é identificado por um ID estável no mapa `elements`; os vínculos são listas `children` e `slots.<nome>`. O patch possui um `schemaVersion` **independente** e até 50 operações ordenadas:

```json
{
  "schemaVersion": 1,
  "operations": [
    {
      "op": "add", "nodeId": "notice", "parentId": "root", "index": 0,
      "node": {"type": "Text", "props": {"text": "Aviso"}, "children": []}
    },
    {"op": "update", "nodeId": "notice", "setProps": {"text": "Aviso atualizado"}},
    {"op": "move", "nodeId": "notice", "parentId": "root"}
  ]
}
```

| Operação | Campos obrigatórios | Semântica |
| --- | --- | --- |
| `add` | `nodeId`, `parentId`, `node` | Insere **um nó folha** com `type`, `props`, `children: []`. `slots` opcionais devem estar vazios. Nunca introduz handlers `on` ou IDs implícitos. |
| `remove` | `nodeId` | Desvincula e remove **toda a subárvore**, incluindo descendentes de slots, não apenas a referência. |
| `move` | `nodeId`, `parentId` | Religa **a mesma subárvore**, preservando IDs e conteúdo. Proíbe ciclos e movimentação da raiz. |
| `update` | `nodeId`, `setProps` e/ou `unsetProps` | Atualiza/remove apenas chaves de **props**, com merge superficial explícito. Não altera tipos, IDs, filhos, slots, eventos, visibilidade, repetição ou ações. |

`add` e `move` aceitam `slot` (slot **já existente e declarado** no pai de destino) e `index` (inteiro não negativo). Por padrão, inserem em `children` ao final. Em `move`, o índice corresponde à **lista final, após a remoção da origem**. São proibidos remover/mover a raiz, reutilizar IDs, apontar para destinos inexistentes, adicionar nós com filhos preexistentes ou índices fora do intervalo. Monte subárvores com operações `add` sucessivas.

## Execução e garantias

A integração suportada é `applyPiTreePatch(spec, patch, "stable")` em `src/ui-runtime/tree-operations.ts`, que delega ao motor puro `scripts/lib/spec-tree-operations.mjs`. O canal `experimental` só pode ser escolhido por um chamador previamente autorizado; o patch não seleciona nem concede seu canal.

1. Verifica JSON, campos estritos, versão v1, limite de 50 operações e chaves reservadas de poluição de protótipos. Rejeita dados não JSON e ciclos.
2. Valida a árvore inicial **e após cada edição** com o **catálogo Zod real** do canal e com `graphErrors` (limites atuais: 300 elementos, profundidade 30). Rejeita explicitamente slots não declarados.
3. Edita somente uma cópia. Qualquer erro retorna `{ok:false,spec:<original>,error:{opIndex,code,message}}`. Nenhuma alteração parcial é observável. Sucesso retorna `{ok:true,spec:<nova cópia>,changes:[...]}`. O resumo contém IDs, posições e chaves, não valores sensíveis.
4. Não grava arquivos, renderiza, executa handlers, promove contratos nem concede permissões Pi. Publicação continua sujeita ao processo de validação e autorização existente.

Essas operações **não são JSON Patch RFC 6902**: IDs estáveis e invariantes da árvore substituem caminhos posicionais cegos. Um patch inválido não libera JSX ou HTML arbitrário.

## Garantias de preservação

Após **cada** operação, uma auditoria independente do escopo de mutação compara a árvore anterior com a árvore proposta, antes de aceitar o resultado:

- A raiz, todo o `state` global e os demais campos globais ficam intactos. Nenhum patch redefine ou migra estados de formulário.
- IDs preexistentes não podem ser renomeados ou substituídos implicitamente. IDs removidos anteriormente **na mesma transação** (inclusive os criados e depois excluídos) não podem ser reutilizados: erro `id_reuse` com rollback integral.
- `add` insere exatamente o nó declarado; `remove` exclui apenas a subárvore selecionada; `move` mantém IDs e conteúdo integral da subárvore; `update` altera somente as chaves solicitadas de `props`.
- Apenas listas `children` ou `slots.<nome>` explicitamente atingidas podem mudar, com preservação conferida da ordem das referências. Irmãos, outros slots, handlers, visibilidade, repetição, props e subárvores não atingidos devem continuar idênticos.
- Qualquer mutação fora do escopo declarado falha com `preservation_violation`. A validação de grafo também impede referências **estruturais** pendentes após remoções e movimentações.

Strings que se parecem com IDs em `props` ou `state` próprios da aplicação **não** são interpretadas automaticamente como referências nem reescritas. Relações de domínio exigem contrato explícito próprio; a API conserva esses valores sem conceder novas ações ou permissões.

## Verificação

`node --test tests/tree-operations.test.mjs tests/tree-preservation.test.mjs` cobre comportamento offline e invariantes de preservação, erros, slots, ciclos e rollback. `tsx --test tests/tree-operations.integration.test.ts` cobre o Zod real do canal estável. Em ambiente com dependências, execute `npm run test:offline`, `npm run validate` e `npm run build`.
