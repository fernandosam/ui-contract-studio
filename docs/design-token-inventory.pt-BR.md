[English](design-token-inventory.md) | [Português](design-token-inventory.pt-BR.md)

# FASE 3 (E06) — Inventário dos tokens visuais existentes

**Data de referência:** 29/10/2026. **Escopo:** estado das fontes da branch-base `main` no levantamento; inventário observacional, não uma proposta de novos tokens. O relatório completo, incluindo **cada valor de cor e sombra em claro e escuro**, está em [design-token-inventory.json](design-token-inventory.json). Pode ser regenerado sem dependências por `node scripts/inventory-design-tokens.mjs --write` e verificado por `node scripts/inventory-design-tokens.mjs --check`.

## Fontes e critérios

- **Fonte canônica do tema:** `src/globals.css` (`:root, .light-theme`, `.dark-theme`, `@theme inline`); configuração `components.json` aponta para esse arquivo, base `neutral` e shadcn `base-vega`.
- **Valores locais:** `src/index.css` (adaptadores `pg-*`), **não** equivalem automaticamente a novos contratos de tema.
- **Uso nos componentes:** `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/card.tsx`, `src/ui-runtime/layout.tsx` e `src/ui-requirements/layout-quality.ts`.
- **Fonte de tipografia:** `src/main.tsx` carrega Fontsource Variable; a escala Tailwind CSS v4 é herdada do framework quando não redefinida no tema.
- **Classificação:** `canônico` = variável de tema; `alias` = variável `@theme inline` que referencia canônico; `local` = declaração no adaptador; `framework` = utilitário/escala Tailwind, não token inventado pelo projeto; `variante` = opção definida por componente/contrato.

## 1. Cores

São **32 tokens de cor semânticos** declarados tanto em claro quanto em escuro, vinculados a 32 aliases `--color-*` no `@theme inline`. Valores em OKLCH. Principais grupos:

| Grupo | Tokens canônicos |
| --- | --- |
| Superfícies e texto | `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground` |
| Ações e estados | `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground` |
| Contornos e foco | `--border`, `--input`, `--ring` |
| Gráficos | `--chart-1`, `--chart-2`, `--chart-3`, `--chart-4`, `--chart-5` |
| Sidebar | `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring` |

Exemplo verificável: `--primary` = `oklch(0.3012 0 0)` (claro) e `oklch(0.8520 0.0205 100.6306)` (escuro); `--color-primary: var(--primary)` é alias, não terceira paleta.

Há ainda **dois tokens locais**, `--success` e `--warning`, definidos em `src/index.css` para os dois temas e usados por adaptadores; **não há** aliases `--color-success`/`--color-warning` em `@theme inline`. Não confundir com as cores semânticas globais.

## 2. Tipografia

| Natureza | Existente | Fonte |
| --- | --- | --- |
| Famílias globais | `--font-sans` = Inter Variable; `--font-mono` = JetBrains Mono Variable; `--font-serif` = Playfair Display Variable | `src/globals.css`, `src/main.tsx` |
| Tracking | `--tracking-normal: 0.01em`; aliases `--tracking-tighter`, `--tracking-tight`, `--tracking-wide`, `--tracking-wider`, `--tracking-widest` | `src/globals.css` |
| Títulos locais | `.pg-heading--h1` 1.875rem/1.2; `h2` 1.5rem/1.25; `h3` 1.25rem/1.3; `h4` 1rem/1.5 (tamanho/line-height) | `src/index.css` |
| Texto local | `.pg-text` 0.875rem; `.pg-text--caption` 0.75rem; `.pg-text--lead` 1rem | `src/index.css` |
| Utilitários | `text-sm`, `text-base`, `text-xs`, `font-medium`, `font-semibold` em componentes shadcn | Escala Tailwind; não redefinida como tabela local completa |

`--tracking-normal` é definido em `:root`, portanto também vale para a classe `.dark-theme` no elemento raiz; não há segunda escala de tracking para modo escuro.

## 3. Espaçamento

| Natureza | Valores constatados | Fonte |
| --- | --- | --- |
| Escala de base | Escala `--spacing` / utilitários `p-*`, `gap-*`, `px-*` do Tailwind v4, **não sobrescrita** no `@theme inline` | Framework e componentes |
| Gaps declarativos | `.pg-gap--none` = `0`; `sm` = `0.625rem`; `md` = `1rem`; `lg` = `1.5rem` | `src/index.css` |
| Grid | Fallback `gap: var(--gap, 1rem)` | `src/index.css` |
| Campo/placeholder | `.pg-field` `0.5rem`; `.pg-placeholder` `0.25rem` | `src/index.css` |
| Card shadcn | `--card-spacing: --spacing(6)` padrão e `--spacing(4)` com `size="sm"` | `src/components/ui/card.tsx` |

Gaps `none/sm/md/lg` são opções **da composição declarativa**, não substituem globalmente os utilitários Tailwind.

## 4. Bordas

As cores semânticas são `--border`, `--input` e `--ring`, cada uma com versão claro/escuro; `border-border`, `border-input` e `ring-ring` são consumos das variáveis/aliases. Em `src/index.css`, `.pg-placeholder` usa `1px dashed var(--border)`; `.pg-graph` e `.pg-pagination button` usam `1px solid var(--border)`. Componentes shadcn usam classes como `border`, `ring-1`, `ring-3` e `outline-*`. **Não foi identificado token global próprio de largura de borda** no tema; larguras e estilos são locais ou do framework.

## 5. Raios

`--radius: 0.5rem` é a base global. Os aliases `@theme inline` são `--radius-sm: calc(var(--radius) - 4px)`, `--radius-md: calc(var(--radius) - 2px)`, `--radius-lg: var(--radius)` e `--radius-xl: calc(var(--radius) + 4px)`. `Button` usa `rounded-md`, `Card` usa `rounded-xl`; variantes pequenas do botão usam expressões `min(var(--radius-md), ...)`. O placeholder usa `var(--radius)` diretamente. Não adicionar uma segunda escala.

## 6. Sombras

Oito nomes declarados em ambos os temas: `--shadow-2xs`, `--shadow-xs`, `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg`, `--shadow-xl` e `--shadow-2xl`. `--shadow-xs` referencia `--shadow-2xs`; `--shadow` referencia `--shadow-sm`. As demais usam valores distintos por tema com opacidades maiores no escuro. Exemplos de uso: `shadow-xs` em Button/Input/Card e `shadow-sm` em blocos de demonstração. Valores exatos estão no JSON.

## 7. Densidade

**Não existe `--density` ou escala global própria de densidade.** A densidade é resultado de variantes e regras observadas:

- `Card` oferece `default` e `sm`, com espaçamentos internos diferentes; `Button` tem `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm` e `icon-lg`. `Input` utiliza altura `h-9`.
- `Stack` expõe `gap` `none/sm/md/lg`; `Grid` usa `--columns` (fallback 1). A folha CSS menciona até seis colunas, enquanto o avaliador de qualidade de layout restringe os cenários inspecionados a até quatro, com limites menores em alguns fluxos. **Não tratar o comentário CSS como autorização de contrato Pi**.
- Há media queries `max-width: 639px`, `850px` e `520px` em `src/index.css`. **A regra de 850px aparece depois da de 639px** e pode reintroduzir duas colunas entre 521–639px. Esse conflito de precedência é **risco a verificar em teste de navegador**, não uma conclusão de responsividade aprovada.

## Limites e manutenção

O JSON é gerado **somente de fontes identificadas** e preserva valores literais de CSS; não avalia valores computados do navegador, contraste, uso de toda classe Tailwind, consumo por cada componente ou equivalência visual. O inventário não realiza varredura exaustiva de todos os componentes ReUI e não equivale a auditoria de design/hardcodes.

```bash
node scripts/inventory-design-tokens.mjs --check  # falha em caso de inventário desatualizado
node scripts/inventory-design-tokens.mjs          # imprime JSON derivado das fontes
node scripts/inventory-design-tokens.mjs --write  # atualiza snapshot versionado
node --test tests/design-token-inventory.test.mjs
npm run semantic:check
npm run semantic:report
```

**Governança:** esta entrega não altera estilos, CSS, Tailwind, schema Zod, contratos admitidos, catálogo Pi, permissões ou Admission Engine. A extensão do sistema de temas e qualquer correção responsiva são mudanças futuras independentes, com validação visual própria.
