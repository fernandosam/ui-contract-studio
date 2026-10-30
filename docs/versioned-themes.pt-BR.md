[English](versioned-themes.md) | [Português](versioned-themes.pt-BR.md)

# E06 — Contrato fechado de temas versionados

A seleção de temas pertence ao host confiável. O registro versionado está em `src/ui-theme/themes.json`, o lock de versões em `src/ui-theme/themes.lock.json` e o validador sem dependências em `src/ui-theme/theme-policy.mjs`.

Uma seleção possui **exatamente** `{id, version, mode}`. A seleção inicial autorizada é `studio@1.0.0` no modo `dark`, com suporte também a `light`. Paleta, tipografia, espaçamento, bordas, raios, sombras e densidade são **identificadores fechados**, não valores CSS. As combinações aprovadas refletem `src/globals.css`, sem criar novos tokens ou variantes visuais.

- Cor: `studio-neutral`; tipografia: `inter-jetbrains-playfair`; espaçamento: `tailwind-v4-default`; borda: `semantic`; raio: `base-8px`; sombra: `studio`; densidade: `comfortable`.
- Modos são resolvidos apenas para classes fixas do host (`light-theme` / `dark-theme`) já existentes no CSS. Não se aceitam estilos inline, CSS customizado, classes Tailwind dinâmicas, `className`, `style`, `var()` arbitrário ou novas cores livres.
- IDs, versões, campos, tokens e modos desconhecidos são rejeitados. Mesmo versões sintaticamente válidas não registradas não podem ser usadas.
- Evolução exige revisão explícita: adicionar **nova versão** preservando as antigas; ampliar as opções do validador somente após disponibilizar implementação visual revisada; atualizar o lock e testar. O lock detecta deriva local; em PR, a comparação com a base bloqueia alterações/remoções de versões registradas. O lock isolado não constitui aprovação.
- A seleção de tema é controlada pelo host e **não amplia o JSON gerado**, os schemas Zod, contratos Pi ou permissões; não publica novos candidatos no Admission Engine.

Execute `npm run themes:check`, `npm run test:offline`, `npm run semantic:check` e `npm run semantic:report`. O workflow de qualidade usa `THEME_BASE_REF` apontando para o commit-base da PR. Os valores CSS reais seguem definidos no stylesheet: mudanças nele exigem revisão visual independente (o lock protege o registro, não o arquivo CSS). O E2E visual completo permanece manual em etapa posterior.


## E06 — Integração da seleção nas prévias

O host disponibiliza **o mesmo seletor fechado e versionado** na edição de Primitivas, Compostos admitidos, composições React ReUI, galeria de exemplos ReUI, exemplos/árvores JSON, telas JSON independentes e geradores de padrões/requisitos. A comparação visual antes/depois da edição estruturada compartilha a mesma seleção. As opções provêm exclusivamente do registro validado; não existe campo de CSS livre ou opção não registrada.

**A seleção vale para todo o aplicativo, não para cada prévia isoladamente.** Isso evita inconsistências das variantes Tailwind claro/escuro em temas aninhados e mantém controles, sobreposições e prévias no mesmo modo. O seletor aplica somente as classes aprovadas `light-theme` ou `dark-theme` ao elemento raiz do documento; o botão de alternar claro/escuro no cabeçalho permanece sincronizado. A seleção completa é salva em `ui-contract-studio-preview-theme`; a chave legada `ui-contract-studio-theme` continua alimentando a aplicação do modo antes da renderização. O valor persistido não é confiável e passa pela validação do registro, com retorno seguro ao padrão se a versão for inválida ou removida.

A seleção é **estado visual exclusivo do host**. Ela não integra especificações JSON geradas, JSON copiado, propriedades dos componentes, APIs Pi, operações remotas nem decisões do Admission Engine. Especificações não fornecem classes, tokens ou estilos para mudar o tema. Novas versões exigem revisão explícita do registro/lock e suporte de CSS correspondente.

Testes: `node --test tests/preview-theme-selection.test.mjs` (entradas inválidas, armazenamento adulterado e superfícies integradas) e `npx playwright test tests/e2e/preview-themes.spec.ts --project=desktop --project=mobile` (sincronização, persistência e fallback). Executar também `npm run themes:check`, `npm run semantic:check`, `npm run semantic:report` e as verificações usuais. A aprovação visual no navegador é uma etapa independente dos testes estáticos.

## E06 — Contraste, estados interativos e responsividade

Execute `npm run themes:a11y` para auditar o **CSS real**. O comando converte OKLCH literal aprovado em sRGB linear e verifica 12 combinações semânticas de texto em **WCAG AA ≥ 4,5:1** e duas de foco com **≥ 3:1**, nos modos claro e escuro (28 verificações). Falha com tokens ausentes, valores incompatíveis ou contraste insuficiente. Verifica também a cascata de uma/duas colunas em 520, 600, 639, 640 e 800px; não certifica todas as bordas, camadas translúcidas ou SVGs.

Foram identificadas e corrigidas duas violações: `muted-foreground/muted` no tema claro (~4,12:1 antes, ~4,66:1 depois) e `destructive-foreground/destructive` no escuro (~2,67:1 antes, ~6,26:1 depois). Corrigida também a sobreposição de media queries entre 521 e 639px: a regra de duas colunas (850px) agora precede a regra de uma coluna (639px). Esses ajustes CSS exigem revisão visual, sem alterar registro e lock `studio@1.0.0`.

`node --test tests/theme-accessibility.test.mjs` verifica regressões; `npx playwright test tests/e2e/theme-accessibility.spec.ts --project=desktop --project=mobile` verifica hover, foco por teclado, estado desabilitado, contraste computado na prévia, paridade claro/escuro e larguras 390/600/800/1440px. O workflow existente executa ambos os gates. Aprovação de navegador e E2E visual manual exigem execução efetiva; a análise de fonte não equivale à certificação completa.

Para criar versões, revisar o baseline CSS e executar a nova matriz visual de retorno de tema, consulte [Manutenção de temas e regressão visual](theme-maintenance.pt-BR.md).
