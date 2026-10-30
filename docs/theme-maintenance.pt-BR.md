[English](theme-maintenance.md) | [Português](theme-maintenance.pt-BR.md)

# E06 — Criar, revisar e manter temas

## Fontes de verdade e limites

- `src/globals.css` contém os valores CSS efetivos para `:root, .light-theme` e `.dark-theme`; `src/index.css` contém adaptadores locais, que não são tokens globais.
- `src/ui-theme/themes.json` lista identificador, versão, modos e escolhas **fechadas** de tokens. `src/ui-theme/theme-policy.mjs` valida a lista permitida e resolve somente as classes confiáveis `light-theme`/`dark-theme`.
- `src/ui-theme/themes.lock.json` guarda o fingerprint do manifesto. Ele protege a forma/versionamento **do registro**, mas não congela automaticamente o CSS global.
- `tests/fixtures/theme-visual-tokens.json` fixa um subconjunto revisado de valores CSS de cada modo para o navegador; `tests/e2e/theme-visual-regression.spec.ts` testa Primitivas, Compostos e exemplos JSON em desktop/mobile e anexa PNGs.

**Importante:** atualmente os temas registrados compartilham as duas classes globais do host. Adicionar um ID ou versão no manifesto **não cria uma nova paleta visual** e não permite temas independentes por prévia. Novas paletas exigem suporte de host e CSS explícito, com análise arquitetural e revisão independente; não aceitar CSS/estilo livre de agentes.

## Criação ou evolução de uma versão

1. Inventarie a necessidade e verifique se os tokens e os dois modos já a atendem. Registre a diferença esperada em cores, tipografia, espaçamento, raios, bordas, sombras, densidade e estados.
2. Faça a implementação **no host confiável**, se necessária, respeitando `theme-policy.mjs`. Não aceitar campos `style`, `className`, `css`, valores arbitrários ou expansão automática de Zod, Pi e Admission Engine. Não acrescente apenas uma versão declarativa para simular nova aparência inexistente.
3. Em `themes.json`, acrescente um registro com ID e versão SemVer novos, preservando integralmente versões anteriores. Atualize escolhas permitidas no validador **somente** após revisão da implementação correspondente. Não altere silenciosamente `defaultTheme`.
4. Gere o fingerprint pela função já existente `fingerprintTheme` (comando abaixo), revise a saída e insira a nova entrada em `themes.lock.json`. Nunca sobrescreva fingerprint de versão anterior. A comparação com o SHA base no CI bloqueia edições/remoções de versões registradas.
5. Revise o baseline **somente para alterações CSS intencionais** em `tests/fixtures/theme-visual-tokens.json`, justificando o impacto sobre versões antigas. O CSS global é compartilhado: uma nova versão do registro não isola valores antigos. Verifique também `docs/design-token-inventory.json` com o inventário apropriado.
6. Execute os gates e inspecione capturas claro/escuro de desktop/mobile, incluindo estados hover/focus/disabled, responsividade, popovers e textos longos quando aplicável. Registre divergências, cobertura e limitações na PR.
7. Só integre após revisão humana do efeito visual e checks aplicáveis. A presença de PNG, fingerprint ou teste verde não equivale a aprovação de fidelidade nem certificação Pi.

Para consultar os fingerprints **sem reescrever arquivos**:

~~~bash
node --input-type=module -e 'import {readFileSync} from "node:fs"; import {fingerprintTheme} from "./scripts/lib/theme-lock.mjs"; const themes=JSON.parse(readFileSync("src/ui-theme/themes.json","utf8")).themes; console.log(themes.map(t=>({id:t.id,version:t.version,fingerprint:fingerprintTheme(t)})))'
~~~

## Regressão automática e evidências

~~~bash
npm run themes:check
npm run themes:a11y
node --test tests/theme-visual-regression.test.mjs
npm run test:offline
npx playwright test tests/e2e/theme-visual-regression.spec.ts --project=desktop --project=mobile
npm run docs:check
npm run semantic:check
npm run semantic:report
~~~

No CI, o job de navegador focado do workflow `quality.yml` executa a matriz de Primitivas (`Button`), Compostos (`Dashboard01`) e JSON (explorador de exemplos), com 390px no projeto mobile e 1280px no desktop. O teste verifica valores CSS aprovados, diferença visível entre claro/escuro e **retorno exato dos pixels da região de prévia** ao percorrer claro → escuro → claro. Anexa as imagens dos dois modos aos resultados Playwright; os artefatos existentes preservam `test-results/` por 14 dias.

Esse comparador **não possui imagens douradas persistidas entre commits**: detecta vazamentos e irreversibilidade na alternância, enquanto o fixture pinado e `themes:a11y` detectam mudanças de tokens/contraste. Não detecta toda regressão de pixels entre commits nem substitui avaliação humana. Após uma mudança deliberada, revise screenshots e atualize fixture/inventário com justificativa; não aceite diffs cegamente nem renove snapshots de forma automática.

O E2E completo continua manual na `main`. Esses testes não alteram telas JSON, contratos admitidos, permissões Pi, decisões do Admission Engine ou regras de publicação.
