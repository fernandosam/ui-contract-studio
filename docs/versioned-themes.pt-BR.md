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
