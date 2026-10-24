# Admissão de componentes — contrato obrigatório

O catálogo é **fechado para uso em telas**, mas **aberto para extensões aprovadas**. A base Vercel mantém seus 41 tipos originais e não deve ser editada para adicionar tipos. Não existe instalação automática de Shadcn Studio.

## Diretórios

| Responsabilidade | Caminho |
|---|---|
| 41 contratos de base migrados para API 2.0.0 | `src/ui-catalog/catalog.ts` (`playgroundDefinitions`) |
| Schemas extras | `src/ui-catalog/extensions/catalog.ts` (`extensionDefinitions`) |
| Componentes React extras | `src/ui-catalog/extensions/components/` |
| Adapters do registry | `src/ui-catalog/extensions/registry.tsx` (`extensionImplementations`) |
| Proveniência e aprovação | `src/ui-catalog/sources.json` |
| Telas declarativas | `src/ui-screens/*.json` |

## Sequência de admissão

1. Confirme a inexistência de componente equivalente. Reutilizar `Card`, `Stack`, `Grid`, `Input`, `Metric` etc. é preferível.
2. Escolha um nome PascalCase único; nunca substitua nome da base.
3. Implemente o componente React em `extensions/components/`, respeitando acessibilidade, teclado, claro/escuro, dados dinâmicos e props controladas.
4. Declare o schema Zod em `extensions/catalog.ts`, com `z.object({...}).strict()`, descrição semântica, eventos/slots explícitos apenas quando necessários. Evite `z.any()`, `z.unknown()` sem necessidade e estilos CSS arbitrários em props.
5. Associe um adapter com o **mesmo nome** em `extensions/registry.tsx`. Passe `props` de modo tipado e não aceite JSX arbitrário.
6. Inclua uma entrada em `sources.json` com `name`, `status: approved`, `origin`, `sourceUrl`, `license`, `reviewedOn` e `notes`.
7. Adicione teste unitário, teste de contrato Zod, testes com tema claro/escuro e um exemplo válido (ou tela real) que use o componente.
8. Execute `npm run check`, `npm run validate` e `npm run build`, depois revise o diff.
9. **Somente após validação e revisão**, utilize o tipo nas novas telas.

## Exemplo (somente documentação; não é componente registrado)

Em `extensions/catalog.ts`, importe `z` e acrescente uma chave ao objeto `extensionDefinitions`:

```ts
CounterTile: {
  props: z.object({ label: z.string(), value: z.number() }).strict(),
  description: "Exibe um indicador numérico rotulado",
},
```

Crie `extensions/components/counter-tile.tsx`:

```tsx
export function CounterTile({ label, value }: { label: string; value: number }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <p className="text-sm text-muted-foreground">{label}</p>
      <strong className="text-2xl tabular-nums">{value}</strong>
    </section>
  );
}
```

Adicione em `extensions/registry.tsx`:

```tsx
import { CounterTile } from "./components/counter-tile";
import type { z } from "zod";
import { extensionDefinitions } from "./catalog";

export const extensionImplementations = {
  CounterTile: ({ props }: { props: z.infer<typeof extensionDefinitions.CounterTile.props> }) => (
    <CounterTile {...props} />
  ),
};
```

Registre a proveniência em `sources.json`, execute todos os testes e verifique que a nova tela usa apenas `CounterTile` e tipos previamente aprovados.

## Limites

Uma definição no catálogo não concede automaticamente acesso a APIs, DOM, requisições ou armazenamento. Ações precisam de declaração e handler autorizado, com revisão explícita da arquitetura. Novos componentes não são incorporados silenciosamente a telas existentes.

## Primitivas shadcn/ui (v0.5)

Instalar uma primitiva oficial (`src/components/ui/*.tsx`) **não altera o catálogo json-render**. Consulte [integracao-shadcn.md](integracao-shadcn.md) para o plano atual de 37 componentes, configuração de aliases e procedimento `npm run shadcn:install`. Para novos componentes, prefira reutilizar primitivas shadcn nas composições JSON aprovadas e gerar os wrappers estáticos automaticamente pela fábrica; componentes stateful usam React explícito. As especificações JSON continuam proibidas de referenciar arquivos React diretamente.
