# Qualidade e homologação — v0.19

| Comando | Execução |
|---|---|
| `npm run test:offline` | Invariantes estruturais e regressões sem npm instalado |
| `npm run check:core` | Regras rápidas de schema/manifesto/geração (requer tsx/npm) |
| `npm run check` | Orquestra as verificações históricas **uma vez cada** |
| `npm run validate` | `check`, lint e testes unitários/integrados |
| `npm run build` | Somente TypeScript e Vite, sem repetir `check` |
| `npm run verify` | `validate`, `build` e Playwright |
| `npm run composites:generated:check` | Código gerado idêntico ao manifesto revisado |

O CI offline confere os invariantes e o gerador. O CI conectado é **fail closed**: exige lockfile npm, componentes shadcn instalados, `npm ci`, schemas reais, validação, build e Playwright. No ZIP sem dependências/lockfile, **não** se pode declarar build ou testes de navegador aprovados.

Critério de regressão: 141 tipos ativos, 91 composições registradas na fábrica, 9 adapters explícitos, 6 telas e 8 padrões. `tests/simplification-v019.test.mjs` compara templates compilados e verifica a ausência do ciclo runtime.
