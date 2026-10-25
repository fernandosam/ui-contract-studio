# Cobertura funcional ReUI — 31 famílias, 559 exemplos locais

> **Estado: implementação parcial; certificação funcional completa pendente.**
> O inventário cobre as 31 famílias e os 559 exemplos TSX versionados. Isso **não**
> significa paridade funcional ou visual integral com a ReUI. A inspeção estática
> identifica capacidades; somente testes com navegador e evidências de interação
> podem certificar cada exemplo. Novos exemplos publicados upstream não pertencem
> automaticamente a esse recorte versionado.

## Modelo de cobertura

1. **Primitiva Zod**: propriedades reutilizáveis, dados serializáveis, estado local
   seguro e evento autorizado. O contrato não aceita JSX, CSS arbitrário nem
   callbacks fornecidos por IA.
2. **Composição React ReUI**: exemplos locais `c-*-*.tsx` mantêm layout,
   interações próprias e importações de outras primitivas. São disponíveis no
   catálogo explorável, **não** novos tipos Pi automaticamente.
3. **Contrato semântico próprio**: `OnboardingChecklist`,
   `RatingDistribution` e `CharacterCountTextarea` foram admitidos
   separadamente com Zod e adapter.
4. **Não admitido**: mídia externa sem fonte autorizada, operações transacionais,
   fluxos de login/conta, persistência e ações não declaradas.

## Cobertura por família

| Família | Exemplos | Representação e evolução funcional | Limite que não deve virar prop genérica |
|---|---:|---|---|
| Accordion | 11 | Single/multiple, estado expandido, indicadores e aparência existentes | Conteúdo aninhado, avatares e checklist são composições |
| Alert | 20 | **Novo:** título/ícone opcionais; tons tipados e dismiss local | Botões de ação e avisos com identidade externa |
| Avatar | 35 | **Novo:** formato, posição do indicador, fallback, dimensões e presença local | Fotos externas, grupos, badge, menu de conta |
| Badge | 25 | **Novo:** tons, aparência sólida/suave/contorno, tamanhos e dot | Links, remoção e imagens exigem composição |
| Button | 61 | Variantes/tamanhos oficiais, loading, contagem e ícones admitidos anteriormente | Copy, login social, tema e split action têm estado/fluxo |
| ButtonGroup | 57 | **Novo:** variantes/tamanhos uniformes e ícones seguros; seleção demonstrativa e orientação | Input, menu, múltiplos comandos e transações |
| Card | 18 | **Novo:** rodapé textual além dos slots e limites de largura | Layouts multimídia e botões compostos |
| Carousel | 11 | Loop, setas, indicadores, densidade e orientação existentes | Mídias externas, thumbnails, autoplay |
| Checkbox | 22 | **Novo:** descrição e invalid, além de estado, required e disabled | Grupos, cards de termos e submissões |
| Collapsible | 10 | Disclosure e slots declarados existentes | Árvore e controles internos complexos |
| Dialog | 10 | Abertura controlada e conteúdo em slot existente | Formulários, confirmações e submissões remotas |
| Drawer | 5 | Direção, estado de abertura e slot existentes | Workflows e componentes internos não autorizados |
| DropdownMenu | 18 | Separadores, rótulos, checkbox e submenu de um nível existentes | Conta, workspaces, fontes remotas e comando transacional |
| Input | 31 | **Novo:** ajuda, aria-invalid e maxLength | Busca global, uploads e addons compostos |
| Pagination | 15 | Janela de páginas, salto, first/last e page size já existentes | Consulta real, paginação remota e estado de URL |
| Popover | 11 | Abertura, alinhamento e conteúdo textual existentes | Formulários e seleções ricas em composição |
| Progress | 8 | **Novo:** tonalidades de estado e controle de exibição do valor | Etapas temporizadas e barras compostas |
| RadioGroup | 17 | **Novo:** descrição textual por opção; seleção única, disabled e orientação | Cartões de preço, pagamento e avatares |
| Select | 33 | **Novo:** grupos rotulados e descrição de opções | Avatares, flags via URL, filtragem e entradas multimídia |
| Separator | 6 | **Novo:** rótulo textual centralizado | Blocos completos de informação entre divisões |
| Skeleton | 10 | **Novo:** formas e quantidade limitada de linhas; dimensões existentes | Templates inteiros de card, chat e tabela |
| Slider | 12 | **Novo:** 1–3 polegares, intervalos, passos e valores | Gradientes, ticks ricos, teclado de incremento e emoji |
| Spinner | 12 | **Novo:** tons e rótulo apenas para leitor de tela | Overlays e botões compostos |
| Switch | 14 | **Novo:** tamanho sm/default e descrição acessível | Preferências em cards, ajuda rica e persistência |
| Table | 17 | **Novo:** vazio, densidade compacta e zebra | Ordenação/edição/filtros: utilizar DataTable |
| Tabs | 9 | **Novo:** painéis textuais, list variant line e disabled por tab | Painéis React de formulários, roteamento e nested tabs |
| Textarea | 6 | **Novo:** ajuda, invalid e maxLength | Contador dinâmico: CharacterCountTextarea |
| Toggle | 14 | **Novo:** ícones permitidos; pressed, tamanho/variante e evento | Contagem, ícones ricos, tooltip e combinações |
| ToggleGroup | 16 | **Novo:** ícones allowlisted e opção individual disabled | Itens rich e ações externas |
| Tooltip | 16 | **Novo:** ícone de gatilho e atalho textual | Conteúdo com avatar e ações ricas |
| Rating | 9 | **Novo:** seleção em meia estrela e valor visível; exibição fracionária | Interatividade em meia estrela, avaliação com envio, escalas de faces |
| **Total** | **559** | **31 famílias com exemplos React versionados; 22 contratos base distintos evoluídos nesta rodada** | **Fidelidade completa ainda não certificada** |

## Evidência existente e critérios de conclusão

- `npm run reui:audit:check` examina os 559 TSX e verifica o
  snapshot/hash de fonte. A auditoria extrai propriedades recorrentes, estados
  e sinais de integração, mas não executa eventos nem navegador.
- `tests/reui-family-functional-coverage.integration.test.ts` verifica a
  correspondência das 31 famílias com 559 fontes, aceitação dos 14 conjuntos iniciais de
  propriedades por Zod, além de 8 conjuntos complementares e recusa de atributos indevidos.
- `tests/e2e/reui-gallery-full.spec.ts` verifica a renderização no navegador
  dos 559 exemplos em 31 famílias, sem fallback de prévia, **quando executado**.
  Sua execução é manual na `main` segundo a política do projeto.
- A homologação exige, além do teste de montagem, **cenários efetivos de
  clique/teclado/estado, ARIA, navegação por foco, responsividade e revisão
  visual com capturas reais por variação**. A CI de PR não substitui isso.
- As **8 decisões deferred-semantic**, **15 existing-contract-gap**, **22
  existing-composition**, **3 approved-semantic** e **511
  existing-primitive-variant** permanecem rastreadas em
  `src/ui-catalog/reui-semantic-admissions.json`. Essas classificações são
  decisões de arquitetura, não afirmações de que cada variação está homologada.

## Pendências objetivas para a certificação de 100%

1. Exercitar interações reais de cada amostra (não apenas renderização)
   com evidência reproduzível por `exampleId`.
2. Resolver individualmente as lacunas de contrato ainda descritas na matriz
   de decisões, sem promover comportamentos bloqueados por política.
3. Comparar cada variação com a referência upstream, incluindo visual,
   teclado, screen readers e estados responsivos.
4. Submeter à revisão independente as versões `2.1.0` propostas; o lock
   versionado é trilha de auditoria, não uma autoaprovação.
