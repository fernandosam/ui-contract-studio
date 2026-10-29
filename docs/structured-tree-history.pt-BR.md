[English](structured-tree-history.md) | [Português](structured-tree-history.pt-BR.md)

# E08 — Prévia das diferenças e histórico da árvore JSON

A E08 usa o **mesmo motor de patches** de [operações estruturadas](structured-tree-operations.pt-BR.md): `applyPiTreePatch` valida cada operação com o catálogo Zod estável e as invariantes estruturais. A prévia e o histórico não introduzem um segundo schema, permissões Pi, JSX arbitrário, ações remotas ou persistência.

## Interface

Abra **Exemplos e padrões**, escolha uma tela ou padrão e procure **Alterações estruturadas · E08**. Edite um patch v1 com `add`, `remove`, `move` ou `update` e clique em **Pré-visualizar diferenças**. A seção mostra IDs adicionados/removidos, reposicionamentos e nomes de propriedades afetadas, sem valores no resumo, além de uma comparação visual opcional *antes/depois*. Só depois da validação o botão **Aplicar prévia** fica disponível.

**Desfazer** e **Refazer** recuperam revisões da sessão. O histórico é limitado a 50 commits por padrão (configurável de 1 a 100). Uma nova aplicação após desfazer descarta o ramo de refazer; se o limite for excedido, revisões mais antigas deixam de ser recuperáveis. Ao trocar de exemplo, a sessão anterior é descartada. Não há gravação em disco, registro de auditoria persistente ou sincronização entre usuários.

## API interna

```ts
import { createPiTreeEditSession } from "../src/ui-runtime/tree-edit-session";

const session = createPiTreeEditSession(spec); // apenas canal stable por padrão
const preview = session.preview({ schemaVersion: 1, operations: [
  { op: "update", nodeId: "title", setProps: { text: "Novo título" } },
] });
if (preview.ok) {
  // preview.diff: metadados sem valores; preview.spec: árvore validada para renderização.
  const applied = session.commit(); // revalida e confere a equivalência exata com a prévia
}
session.undo();
session.redo();
const view = session.read(); // cópia isolada da árvore e resumo do histórico
```

A fábrica pura `createTreeEditSession(original, applyPatch, {maxEntries})` mora em `scripts/lib/spec-tree-history.mjs`; `applyPatch` **deve** ser fornecido por um chamador confiável que fixe previamente o canal e as allowlists. Não aceite uma seleção de canal vinda da spec, do patch ou do agente.

- `preview` não modifica a revisão atual; prévias inválidas ou sem diferenças não podem ser aplicadas.
- `commit` reexecuta o patch pelo mesmo validador e rejeita resultados divergentes ou prévias inexistentes. Não existe commit parcial.
- `undo/redo` reproduzem patches validados, checam equivalência com os resultados guardados e recusam revisão incompatível sem alterar o estado.
- `read()`, `preview.spec`, diffs e logs são cópias independentes. O histórico público contém **IDs/nomes**, não valores de props; snapshots com valores ficam apenas na memória privada da sessão. A comparação visual e o JSON atual podem exibir conteúdo por serem prévias, portanto não devem ser tratados como logs seguros.
- O resumo de *move* diferencia uma movimentação explícita de um deslocamento indireto de índice provocado por inserção/remoção. Uma sequência de operações pode produzir diferença líquida zero e, nesse caso, a prévia é recusada.

## Validação

Executar em ambiente provisionado: `node --test tests/tree-history.test.mjs`, `tsx --test tests/tree-history.integration.test.ts`, `npm run test:offline`, `npm run semantic:check`, `npm run semantic:report`, `npm run validate` e `npm run build`. Os testes cobrem rollback, slots, preservação de IDs e estado, truncamento de redo, limites do histórico, vazamento de valores em resumos e revalidação contra o Zod real.
