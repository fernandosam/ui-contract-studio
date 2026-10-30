[English](pi-decision-records.md) | [Português](pi-decision-records.pt-BR.md)

# E10 — Registro de decisões do Pi por contrato e evidência

A decisão de seleção é **consultiva**, não é aprovação, admissão, autorização, prova de execução E2E ou evidência de que o modelo seguiu o contexto. Este registro complementa os [eventos de execução E10](pi-execution-events.pt-BR.md), sem modificar as permissões existentes.

## Conteúdo registrado

Cada linha JSONL usa um contrato fechado, versionado (v1), definido em `scripts/lib/pi-decision-records.mjs`:

- `decisionId` (UUID por decisão), `executionId` (o mesmo dos eventos de execução), data UTC, origem (`pi-select` ou `pi-context`) e `authority: advisory-only`.
- Resultado `recommended`, `ambiguous` ou `no-match`, com referência ao contrato selecionado somente quando houver recomendação suficientemente fundamentada.
- Para cada candidato considerado no limite do ranking: `contract.type`, `contract.version`, `contract.fingerprint`, disposição (`candidate`, `avoid`, `unavailable` ou `no-positive-evidence`), pontuação e cobertura agregadas.
- Referências às evidências **sem o conteúdo**: campo `type`, `purpose`, `whenUse` ou `whenNotUse`, índice posicional no perfil semântico e contagem de termos correspondentes. `profileDigest` é o SHA-256 do subconjunto `component/purpose/whenUse/whenNotUse` da orientação utilizada. Recuperar o perfil daquela revisão do Git para verificar a correspondência; o digest do perfil não é prova de execução.
- Critérios por candidato `stableEligible`, `hasPositiveEvidence`, `negativeVeto` e política `pi-semantic-selection` v1: apenas contratos estáveis já admitidos, cobertura mínima de 0,6 e diferença mínima de 3 pontos quando há segunda opção positiva. Também são registradas cobertura líder, diferença de pontuação e comparação de cobertura.

`evaluatedCount` é o total considerado pelo selecionador; `loggedCount` pode ser menor por causa do `--limit`. Um `pi:context` sem `--requirement` é uma escolha explícita de tipos pelo hospedeiro, e **não** registra uma decisão semântica fictícia.

## Ativação local (opt-in)

```bash
export UI_CONTRACT_EXECUTION_ID="$(node -e 'process.stdout.write(require("node:crypto").randomUUID())')"
export UI_CONTRACT_EVENTS_FILE=reports/pi-execution/events.jsonl
export UI_CONTRACT_DECISIONS_FILE=reports/pi-execution/decisions.jsonl

npm run pi:select -- --requirement="ação explícita com botão" --types=Button,Card
npm run pi:context -- --types=Button,Card --requirement="ação explícita com botão" --metadata-only --stdout
```

Sem `UI_CONTRACT_DECISIONS_FILE`, nenhum registro de decisão é persistido e a saída JSON dos comandos continua idêntica. Os arquivos de decisões e eventos devem ser **distintos**. Apenas `reports/pi-execution/<nome>.jsonl` é aceito: traversal, redirecionamento por symlink e nomes fora da lista são rejeitados. São arquivos locais ignorados pelo Git, sem upload ou retenção automática.

## Limites de privacidade e confiabilidade

Não são persistidos requisitos textuais, palavras-chave da solicitação, trechos de documentação, prompts, nomes de arquivos, specs, saídas do modelo, mensagens de erro, dados pessoais ou credenciais. Contratos e hashes referem-se às projeções e perfis realmente consultados; alterações posteriores exigem consultar a revisão histórica correspondente. O registro não garante que uma solicitação não tenha dados sensíveis: somente um conjunto fechado de **metadados** é gravado.

A escrita é diagnóstica e opcional. Antes de centralizar logs, definir permissões e retenção. A emissão em JSONL não é transação distribuída; após uma interrupção, um evento iniciado pode não ter término e a ausência de registro não indica sucesso.

## Verificações

```bash
node --test tests/pi-decision-records.test.mjs tests/execution-events.test.mjs tests/pi-semantic-selection.test.mjs
npm run semantic:check
npm run semantic:report
npm run test:offline
npm run docs:check
```

Testes automatizados do módulo e do CLI validam abstenção, referências de evidência, rejeição de dados arbitrários, correlação com eventos, preservação de stdout e segurança do arquivo. Executar os comandos no checkout com as dependências instaladas e conferir os checks do PR; isso não substitui o E2E completo manual.