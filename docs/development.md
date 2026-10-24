# Desenvolvimento e qualidade

Use Node.js **22+** e dependências verificadas pelo `package-lock.json`. O [README](../README.md) apresenta a instalação; ambientes com rede limitada devem consultar a [sandbox](../sandbox/README.md).

## Comandos

| Comando | Objetivo |
| --- | --- |
| `npm run dev` | Desenvolvimento com Vite |
| `npm run test:offline` | Invariantes com Node.js e sem instalar dependências |
| `npm run docs:check` | Links locais e consistência entre manifestos |
| `npm run validate` | Verificação estrutural, lint e testes |
| `npm run build` | TypeScript e bundle Vite |
| `npm run verify` | Validação, build e E2E local |
| `npm run shadcn:verify` | Integridade da instalação das primitivas |
| `npm run composites:generated:check` | Saídas do gerador sincronizadas |
| `npm run pi:verify` | API e fixtures do agente |

`docs:check` opera sem acesso à rede. Modificações documentais devem executar `docs:check` e `test:offline`; mudanças de código exigem os checks específicos e, quando disponíveis, `validate` e `build`.

## CI e navegador

- [Quality](../.github/workflows/quality.yml): executa em PRs e pushes para `main` e inclui checks offline, `npm ci`, schemas Pi, verificações da instalação, `validate` e `build`.
- [E2E manual (main)](../.github/workflows/e2e-manual.yml): workflow de execução **manual, apenas na main**. Não é acionado automaticamente em cada PR.
- [Auditoria visual oficial](../.github/workflows/bootstrap-visual.yml): fluxo separado que pode registrar screenshots, comparações e evidências.

Capturas só comprovam o que foi renderizado e observado. Diferenças de pixels entre demos com dados/estados distintos são diagnósticas, **não critério automático de fidelidade**. Consulte [revisão visual](revisao-visual-shadcn.md) e [auditoria oficial](official-component-visual-audit.md).

## Definição de pronto

Registre escopo, arquivos alterados, testes executados e limitações. Mudanças no schema requerem versão/lock, origem, exemplos e revisão independente; alterações visuais exigem validação proporcional ao risco. Não declare build, E2E, avaliação real do Pi ou revisão humana como concluídos sem evidência.
