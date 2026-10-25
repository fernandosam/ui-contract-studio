[English](design-system.md) | [Português](design-system.pt-BR.md)

# Design system — ui-contract-studio (v0.4)

## Tema
- Fonte de verdade: **`src/globals.css`**, com as paletas OKLCH fornecidas para claro (`:root, .light-theme`) e escuro (`.dark-theme`).
- Base: shadcn/ui `base-vega`, Tailwind CSS v4, ícones Lucide, raio-base 0.5rem.
- Tipografia: **Inter** na interface, **JetBrains Mono** em dados técnicos e **Playfair Display** disponível para conteúdo editorial. As fontes são servidas localmente via Fontsource.
- A paleta é neutra/quente com variações terrosas nos gráficos, não idêntica à paleta monocromática da Vercel.
- `@theme inline` usa stacks de fontes explícitas em vez de `--font-sans: var(--font-sans)` para evitar referência cíclica; sombras originais são definidas por tema e consumidas pelos componentes.
- O código antigo que referenciava Geist foi substituído pelo conjunto de fontes definido no tema.

## Regras visuais
- O componente novo usa `--background`, `--card`, `--popover`, `--primary`, `--accent`, `--muted`, `--border`, `--ring`, `--chart-1..5`, `--sidebar-*` e `--shadow-*`.
- A camada `src/index.css` contém CSS local do shell e dos renderizadores existentes. Novos estilos devem ser escopados ao componente, preferencialmente com Tailwind/tokens, sem introduzir paleta paralela.
- O shell (menu, navegação, cabeçalho, tema) é infraestrutura fixa e não faz parte do catálogo gerável.
- Priorizar contraste, teclado, responsividade, focus visible e valores tabulares em indicadores.

## Admissão
- O conjunto disponível é **41 tipos de base + extensões aprovadas**.
- As extensões residem em `src/ui-catalog/extensions/`, com **schema Zod**, **componente React**, **adapter no registry**, **proveniência no manifesto** e **testes**.
- Não é permitido construir páginas com JSX direto; todas as telas permanecem JSON `json-render`.
- Processo completo: [admissao-componentes.md](./admissao-componentes.pt-BR.md).

## Incorporação de shadcn/ui (v0.5)
- `src/components/ui/` é o destino exclusivo do CLI shadcn; aliases foram alinhados ao Vite/TypeScript.
- Componentes instalados herdam tema e CSS variables de `src/globals.css`; não substituir por tema padrão do CLI.
- `src/ui-catalog/*` permanece o contrato da IA. Para uso em telas, a primitiva precisa de adapter e, quando novo tipo, schema Zod e aprovação.
- Os 21 primitivas planejadas, instruções e status de instalação estão em `shadcn-plan.json` e [integracao-shadcn.md](integracao-shadcn.pt-BR.md).
