[English](pattern-layouts.md) | [Português](pattern-layouts.pt-BR.md)

# Contratos semânticos de layout: login, busca e dashboard

Esta entrega estende a estratégia do [cadastro](registration-layout.pt-BR.md) às interfaces geradas pelo assistente de padrões, **sem criar um novo motor de admissão**.

O único perfil consultivo versionado é `src/ui-requirements/pattern-layouts.json`. A função `planPatternLayout`, em `src/ui-requirements/pattern-layout.ts`, produz um plano determinístico a partir das decisões do usuário e do perfil. `generatePatternPreview` continua gerando **somente** elementos já admitidos no catálogo Pi. `tracePattern`, separadamente, audita a árvore produzida e rejeita mesmo alterações estruturalmente válidas que contrariem ordem, hierarquia ou densidade.

## Regras por tela

- **Login:** cartão centralizado com `maxWidth: md`, identificação antes da senha, opção «lembrar-me» depois da senha, ajuda opcional antes da ação, botão demonstrativo e aviso final. Não realiza login ou persistência de sessão.
- **Busca:** título, depois filtros opcionais de data agrupados em um `Stack`, depois resultados no `DataTable` já existente. Busca interna, paginação e seleção mantêm suas propriedades autorizadas; nenhum backend ou filtro remoto é inferido.
- **Dashboard KPI:** título `Heading` antes do `Grid` de 2 ou 4 cartões, conforme a densidade explicitamente selecionada; nota opcional após **todos** os indicadores, jamais aninhada no primeiro.
- **Dashboard gráficos:** `Card` com `Grid` de dois gráficos locais e nota opcional depois do conjunto. Não há fonte externa nem atualização automática inferida.

**Responsividade:** o `Grid` aprovado usa o CSS responsivo já presente em `src/index.css`: no máximo duas colunas em telas intermediárias e uma no celular, preservando a ordem de leitura da árvore Pi. A política não adiciona propriedades, breakpoints ou handlers ao Zod.

## Rastreabilidade e segurança

O assistente `PatternWizard` exibe a sequência de regiões antes da geração. A auditoria estática `tracePattern` valida a composição independentemente do gerador, enquanto `assessChangeImpact` relaciona o perfil e a função às três famílias. Ações, callbacks arbitrários, autenticação, busca remota e dados persistidos **não são admitidos** por conhecimento semântico. O padrão de listagem permanece inalterado.

Os testes de integração `tests/pattern-semantic-layout.integration.test.ts` conferem variantes, hierarquia, ordem, densidade, exclusão de seções opcionais, regressões que ainda passam no schema Zod e ausência de permissões novas.

```sh
npm run semantic:check
npm run semantic:report
npm run test:offline
npx tsx --test tests/pattern-semantic-layout.integration.test.ts tests/requirements-traceability.integration.test.ts tests/requirements-impact.integration.test.ts
npm run build
```

**Limite:** os checks acima não certificam acessibilidade nem execução no navegador. O E2E completo continua para a etapa posterior acordada, sem adicionar um novo status obrigatório ao auto-merge.
