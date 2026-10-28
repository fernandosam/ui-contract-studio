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

## Auto-merge nativo para PRs comuns

O [workflow de qualidade](../.github/workflows/quality.yml) solicita automaticamente o **auto-merge nativo com squash** ao abrir ou atualizar um PR não draft para a `main`, **desde que a branch pertença ao próprio repositório**. Não cria outro PR nem contorna os checks. O GitHub aguarda os dois checks obrigatórios do ruleset (qualidade semântica/offline e integração/build, incluindo E2E de admissão do formulário).

O [filtro de elegibilidade](../scripts/ci-auto-merge-policy.mjs), executado **a partir da revisão confiável da branch base**, verifica todas as alterações retornadas pela API GitHub. Arquivos de workflows/actions, políticas de CI, dependências, lock de contratos, admissão/Zod/Pi, permissões e backend ficam **fora da ativação automática**, exigindo revisão normal. Renomeações de arquivos sensíveis também são bloqueadas. PRs draft ou de forks não são inscritos; se uma revisão posterior se tornar sensível, a automação tenta desativar o auto-merge existente. O job com escrita não executa código do PR e nunca usa `--admin`.

**Pré-requisitos:** habilitar Settings → General → Pull Requests → Allow auto-merge; as permissões do Actions precisam permitir atualização de PR pelo token do job. Para elegíveis, usa `gh pr merge --auto --squash --match-head-commit`. Se o GitHub recusar, o job informa a falha e o PR permanece aguardando ação humana. O job E2E ampliado ainda é complementar, não é um status exigido pelo ruleset; o protocolo E2E do formulário já integra o check obrigatório.

## CI e navegador

- [Quality](../.github/workflows/quality.yml): executa em PRs e pushes para `main`, separando testes offline (sem instalação), checks de código com `npm ci` imutável, schemas Pi, lint, testes integrados e build. Em PRs exclusivamente documentais, os testes Playwright focados são omitidos; qualquer mudança de código, configuração, dependência ou workflow executa esses testes.
O job existente **Source, docs and offline tests** também valida a qualidade semântica com `semantic:check` e `semantic:report`. Publica o artefato `semantic-knowledge-report` (JSON de cobertura/atualidade e logs de falha) mesmo quando o check falha, além de um resumo acionável. JSON inválido é marcado com `validation.status: failed`; avisos de revisão após mudanças no código continuam consultivos. Consulte o [checklist semântico T28](semantic-knowledge-checklist.pt-BR.md) para comandos e regressões.

- [E2E manual (main)](../.github/workflows/e2e-manual.yml): execução **somente diagnóstica**, manual na `main`, com permissão de leitura. Executa a suíte completa e publica as evidências, sem criar PR de certificado nem alterar permissões Pi.
- [Auditoria visual oficial](../.github/workflows/bootstrap-visual.yml): execução manual exclusiva para bootstrap e comparações de screenshots oficiais; não repete a suíte E2E funcional.

Capturas só comprovam o que foi renderizado e observado. Diferenças de pixels entre demos com dados/estados distintos são diagnósticas, **não critério automático de fidelidade**. Consulte [revisão visual](revisao-visual-shadcn.pt-BR.md) e [auditoria oficial](official-component-visual-audit.pt-BR.md).

## Definição de pronto

Registre escopo, arquivos alterados, testes executados e limitações. Mudanças no schema requerem versão/lock, origem, exemplos e revisão independente; alterações visuais exigem validação proporcional ao risco. Não declare build, E2E, avaliação real do Pi ou revisão humana como concluídos sem evidência.

Os workflows reutilizam `.github/actions/setup-deps` (Node 22, cache npm e `npm ci`) e `.github/actions/setup-chromium` (reaproveita navegador instalado e baixa Chromium apenas quando necessário). O workflow pago de [avaliação Pi](../.github/workflows/pi-evaluation.yml) é manual e limitado à `main`; nenhuma chamada paga faz parte da CI de PR.

Os cenários E2E orientados por riscos semânticos (T29) estão em [riscos E2E semânticos](semantic-e2e-risks-t29.pt-BR.md). Eles usam o job de navegador existente para PRs e o E2E manual na main; os relatórios são consultivos, não certificações Pi automáticas.
