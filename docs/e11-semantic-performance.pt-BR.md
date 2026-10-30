[English](e11-semantic-performance.md) | [Português](e11-semantic-performance.pt-BR.md)

# E11 — Indexação semântica e carregamento dos catálogos

## Escopo

O índice de pesquisa é **consultivo**, não um mecanismo de admissão. As únicas fontes são metadados já revisados e orientações ReUI. Capacidades não implementadas ou proibidas não se tornam permissões do Pi por aparecerem na busca.

- **Contratos:** `buildDiscoveryIndex` normaliza nome, descrição, finalidade e recomendações positivas uma vez por revisão do catálogo. `discoverIndexedContracts` reutiliza o índice nas buscas e nos filtros, preservando a ordenação. `semanticScore` e `discoverContracts` continuam disponíveis.
- **Galeria ReUI:** `buildReuiExampleIndex` pré-indexa 559 exemplos em 31 famílias. `filterIndexedReuiExamples` preserva buscas por título, ID, família, melhor uso e quando não usar. O explorador de compostos também normaliza os campos uma única vez.
- **Prévias:** exemplos aprovados e experimentais são resolvidos pelo manifesto Pi em um conjunto de caminhos de importação permitido pelo Vite. Somente o JSON selecionado é carregado e mantido em cache de memória. Padrões são importados ao serem selecionados; telas existentes reutilizam o registro do aplicativo.
- **Falhas e concorrência:** requisições abandonadas não atualizam estados; exemplos não encontrados são indicados na interface. Não há importações arbitrárias com caminhos gerados pela entrada do usuário.

O manifesto Pi, os metadados semânticos e o registro de telas do aplicativo continuam como antes. Não se trata de uma reescrita completa do renderizador.

## Verificação

Executar `npm run test`, `npm run typecheck`, `npm run semantic:check` e `npm run semantic:report`. Os testes verificam equivalência de 559 exemplos, acentuação, termos cruzados e filtros Pi/maturidade. `npm run perf:catalog` fornece uma comparação reproduzível entre criação do índice a cada consulta e reutilização; não há limite de tempo frágil no CI. Para afirmar ganhos quantitativos de carregamento, medir bytes de rede e desempenho em build de produção.

Não foram ampliados schemas Zod, fingerprints, contratos admitidos, APIs geradas nem permissões Pi.
