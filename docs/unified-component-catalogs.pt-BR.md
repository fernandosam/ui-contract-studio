[English](unified-component-catalogs.md) | [Português](unified-component-catalogs.pt-BR.md)

# Catálogos de componentes unificados

A navegação contém **Primitivas** e **Compostos**, sem um menu separado Catálogo Pi. A consulta legada `?screen=catalogo-pi` abre Compostos sem modificar o Admission Engine interno.

Ambos os catálogos reutilizam o mesmo explorador: lista pesquisável, filtro de maturidade, estado vazio e abas de detalhes para prévia/propriedades, metadados do contrato e orientações/testes semânticos. Os detalhes leem versão, fingerprint semântico SHA-256 e estabilidade diretamente do lock revisado. A disponibilidade ao Pi é uma projeção de somente leitura confrontada com o manifesto Pi gerado; essa interface não promove nem autoriza APIs.

**Compostos** contém as prévias experimentais de admissão na aba **Candidatos experimentais**. Permanecem as prévias locais validadas com Zod, o seletor de canal e os controles de digest e evidência E2E. Os exemplos ReUI continuam em sua própria aba. Nenhuma evidência E2E ou permissão de execução remota é presumida.

O editor visual existente continua validando alterações com Zod antes da prévia, sem persistir modificações. Nenhum tipo, propriedade ou ação de contrato é adicionado. Indicadores de foco por teclado, rótulos, estado de seleção e estados vazios explícitos favorecem a acessibilidade.

Verifique com `npm run test:offline`, `npm run check`, `npm run typecheck`, `npm run build` e os projetos Playwright existentes. O teste de invariantes é `tests/unified-catalog-navigation.test.mjs`.
