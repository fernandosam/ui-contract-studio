[English](development.md) | [Português](development.pt-BR.md)

# Desenvolvimento e qualidade

Use Node.js **22+** e dependências verificadas pelo `package-lock.json`. O [README](../README.pt-BR.md) apresenta a instalação; ambientes com rede limitada devem consultar a [sandbox](../sandbox/README.pt-BR.md).

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

- [Quality](../.github/workflows/quality.yml): executa em PRs e pushes para `main`, separando testes offline (sem instalação), checks de código com `npm ci` imutável, schemas Pi, lint, testes integrados e build. Em PRs exclusivamente documentais, os testes Playwright focados são omitidos; qualquer mudança de código, configuração, dependência ou workflow executa esses testes.
O job existente **Source, docs and offline tests** também valida a qualidade semântica com `semantic:check` e `semantic:report`. Publica o artefato `semantic-knowledge-report` (JSON de cobertura/atualidade e logs de falha) mesmo quando o check falha, além de um resumo acionável. JSON inválido é marcado com `validation.status: failed`; avisos de revisão após mudanças no código continuam consultivos. Consulte o [checklist semântico T28](semantic-knowledge-checklist.pt-BR.md) para comandos e regressões.

- [E2E manual (main)](../.github/workflows/e2e-manual.yml): execução **manual, apenas na main**. Primeiro roda o E2E completo sem permissão de escrita; somente um job separado, após baixar evidências da mesma execução, pode certificar e gravar resultados vinculados ao commit. Se a `main` avançar, a certificação é bloqueada.
- [Auditoria visual oficial](../.github/workflows/bootstrap-visual.yml): execução manual exclusiva para bootstrap e comparações de screenshots oficiais; não repete a suíte E2E funcional.

Capturas só comprovam o que foi renderizado e observado. Diferenças de pixels entre demos com dados/estados distintos são diagnósticas, **não critério automático de fidelidade**. Consulte [revisão visual](revisao-visual-shadcn.pt-BR.md) e [auditoria oficial](official-component-visual-audit.pt-BR.md).

## Definição de pronto

Registre escopo, arquivos alterados, testes executados e limitações. Mudanças no schema requerem versão/lock, origem, exemplos e revisão independente; alterações visuais exigem validação proporcional ao risco. Não declare build, E2E, avaliação real do Pi ou revisão humana como concluídos sem evidência.

Os workflows reutilizam `.github/actions/setup-deps` (Node 22, cache npm e `npm ci`) e `.github/actions/setup-chromium` (reaproveita navegador instalado e baixa Chromium apenas quando necessário). O workflow pago de [avaliação Pi](../.github/workflows/pi-evaluation.yml) é manual e limitado à `main`; nenhuma chamada paga faz parte da CI de PR.

Os cenários E2E orientados por riscos semânticos (T29) estão em [riscos E2E semânticos](semantic-e2e-risks-t29.pt-BR.md). Eles usam o job de navegador existente para PRs e o E2E manual na main; os relatórios são consultivos, não certificações Pi automáticas.
