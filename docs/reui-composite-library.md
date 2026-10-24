# Biblioteca de componentes compostos ReUI — ReUI

## Escopo

A ReUI preserva **559 exemplos TSX** de **31 famílias** ReUI. Cada exemplo possui identidade própria de **componente React reutilizável** (`ReuiAccordion01`, `ReuiButton01`, `ReuiAlert01` etc.), um contrato estrito de propriedades de apresentação e metadados completos de orientação. A implementação visual e as interações continuam no TSX original, sem duplicação de lógica.

O Explorador de Componentes Compostos apresenta duas bibliotecas independentes: **Contratos aprovados** (catálogo fechado do json-render/Pi) e **Composições ReUI (559)** (componentes React da ReUI). Há um link **Abrir componente composto** em cada exemplo, com seleção pelo ID.

## Fontes de verdade

- `src/ui-catalog/extensions/composites/reui-composite-definitions.ts`: manifesto derivado das duas fontes oficiais já versionadas, `reui-guidance.json` e `reui-example-guidance.pt-BR.json`, com identidade, origem, uso, contraindicações e notas de agente.
- `src/ui-catalog/extensions/composites/reui-composite-catalog.tsx`: fábrica de um **componente React nomeado por exemplo**, usando a respectiva implementação TSX revisável. Nenhum JSX externo é aceito.
- `src/ui-catalog/extensions/composites/reui-*.tsx`: código-fonte individual e comportamento original de cada padrão.
- `src/ui-runtime/reui-composite-explorer.tsx`: consulta, prévia, filtros, orientação do agente, documentação do exemplo e edição em runtime de largura/alinhamento.

## Contrato seguro

O componente React possui uma API de apresentação estrita validada com Zod:

| Propriedade | Valores admitidos | Padrão |
| --- | --- | --- |
| `width` | `sm`, `md`, `lg`, `full` | `full` |
| `align` | `start`, `center`, `end` | `center` |

Não admite `children`, `className`, HTML, código JSX arbitrário, CSS arbitrário, callbacks, URLs livres ou configurações de efeitos externos. Cada composição é uma **instância de padrão visual com comportamento e dados de demonstração preservados**. Para expor dados de domínio editáveis em uma composição específica, é obrigatória revisão do padrão e definição de props semânticas seguras, em vez de liberar alterações indiscriminadas na árvore JSX.

Exemplo de uso React:

~~~tsx
import {
  reuiCompositeImplementations,
} from "@/ui-catalog/extensions/composites/reui-composite-catalog"

const AccordionComposto = reuiCompositeImplementations.ReuiAccordion01

export function MinhaPagina() {
  return <AccordionComposto width="lg" align="start" />
}
~~~

O componente correspondente continua exibindo as mesmas perguntas e respostas da prévia de ReUI e mantém as recomendações **Melhor para**, **Quando não usar**, **Quando usar** e **Notas do agente** associadas ao seu registro.

## Separação entre componente e demonstração

O contêiner CSS `mx-auto mb-auto w-full max-w-lg` controla somente como o
exemplo aparece na ReUI. Ele não deve integrar o JSX do componente
reutilizável: bloquearia a largura configurável (`width`) e imporia margens
inesperadas ao inserir a composição em telas reais.

Os 11 padrões Accordion e os exemplos Alert 12–20 agora retornam diretamente
seu nó semântico raiz (`Accordion`, `Card` ou `Frame`). A aparência original
permanece no host `ReuiPreview`, que aplica o contêiner apenas nas prévias.

- `ReuiPattern`: monta o componente real, sem margens ou largura da Galeria;
  mantém estado, interações e carregamento sob demanda do exemplo.
- `ReuiPreview`: encapsula o `ReuiPattern` no layout demonstrativo e fornece
  os atributos usados pelos testes de ReUI.
- `ReuiComposite`: utiliza `ReuiPattern` diretamente; `width` e `align`
  declarados no contrato passam a ser a única camada externa de posicionamento.

Não remover contêineres estruturais internos ao componente (por exemplo,
`Frame`, `AccordionItem` e agrupamentos necessários a interação,
acessibilidade ou identidade visual). A extração é feita apenas após confirmar
que a classe é puramente relativa ao *host da demonstração*.

## Limite de admissão ao catálogo Pi

**A biblioteca ReUI não altera automaticamente os 102 contratos aprovados de json-render/Pi.** Isso é deliberado e segue `docs/admissao-componentes.md`: algumas entradas ReUI são apenas variantes de primitivas equivalentes (por exemplo, um botão padrão), para as quais um novo tipo Pi seria redundante. Outras são composições de verdade que podem merecer contratos próprios.

Para admitir uma composição como novo tipo Pi, deve-se avaliar equivalência/semântica, modelar dados e eventos explícitos via Zod em `extensions/catalog.ts`, implementar adapter tipado e template declarativo quando viável, registrar proveniência e licença em `sources.json`, adicionar testes de acessibilidade e regressão, atualizar o lock com revisão humana e gerar fixtures/manifestos. A promoção em massa e sem revisão contraria a política do projeto.

## Validações

- `tests/reui-composite-library.integration.test.ts`: 559 IDs e nomes únicos, integridade de arquivos TSX, fidelidade das informações de exemplo, origem, Zod estrito e preservação do limite Pi.
- `tests/e2e/reui-composite-library.spec.ts`: alternância de biblioteca, seleção via ReUI, edição segura, campos de recomendação e código-fonte.
- `npm run validate && npm run build`; a suíte E2E permanece manual na main.
