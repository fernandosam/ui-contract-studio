[English](pi-execution-events.md) | [Português](pi-execution-events.pt-BR.md)

# E10 — Eventos estruturados de execução Pi (v1)

Este **contrato de diagnóstico opcional** não altera permissões Pi, schemas Zod, contratos admitidos nem controles do Admission Engine.

## Identificadores e formato

Cada linha JSONL é um registro fechado validado por [execution-events.mjs](../scripts/lib/execution-events.mjs).

| Campo | Finalidade |
| --- | --- |
| `schemaVersion` | Inteiro 1, independente da versão do schema de UI Pi |
| `executionId` | UUID compartilhado entre processos de uma execução lógica |
| `operationId` | UUID por tentativa de etapa, mantido no início e término |
| `eventId` | UUID único por evento |
| `sequence` | Sequência crescente por registrador, não global entre processos |
| `timestamp` | Data/hora UTC ISO-8601 da emissão |
| `source` | requirements-preview, pi-select, pi-context, pi-eval, pi-validate |
| `phase` | planning, selection, generation, validation |
| `status` | started, completed, failed, blocked |
| `type` | Exatamente phase.status; exemplo validation.failed |
| `durationMs` | Duração monotônica, somente evento terminal |
| `details` | Metadados escalares de lista fechada |

`details` aceita apenas contadores não negativos e limitados `selectedCount`, `candidateCount`, `issueCount`, `blockerCount`; booleano `valid`; `channel` stable/experimental; `decision` recommended/ambiguous/no-match; e, somente em falha/bloqueio, `reasonCode`: input_invalid, catalog_unavailable, schema_missing, requirements_blocked, validation_failed ou command_failed.

Jamais registrar **prompts, requisitos textuais, JSON de tela, caminhos de arquivos, identificadores de usuários, resposta do modelo, tokens, mensagens/pilhas de exceção, credenciais ou segredos**. Campos desconhecidos são rejeitados; falhas usam código genérico seguro.

## Pontos de instrumentação

- `requirements:preview`: planejamento, geração declarativa autorizada e validação Zod/conformidade. Planos bloqueados geram generation.blocked, sem fabricar validação bem-sucedida.
- `pi:select` e `pi:context`: seleção consultiva, sem conceder autoridade.
- `eval:pi:run`: geração para cada chamada real do Pi/reparo, mantendo a confirmação remunerada existente.
- `pi:validate`: resultado efetivo da validação Zod/grafo, somente contagem de issues; specs inválidas mantêm código de saída não zero.

Esses comandos não compõem automaticamente um workflow. Para correlacionar comandos distintos, compartilhar o ID por variável de ambiente; subprocessos do avaliador Pi herdam essas variáveis.

## Ativação local opcional

```bash
export UI_CONTRACT_EXECUTION_ID="$(node -e 'process.stdout.write(require("node:crypto").randomUUID())')"
export UI_CONTRACT_EVENTS_FILE=reports/pi-execution/events.jsonl
npm run pi:select -- --requirement="explicit button action" --types=Button
npm run pi:context -- --types=Button --metadata-only --stdout
npm run pi:validate -- --file=src/ui-screens/login.json --stdout
```

Sem `UI_CONTRACT_EVENTS_FILE` nenhum arquivo é gravado; stdout/JSON dos comandos fica inalterado. Sem UUID fornecido, cada comando gera identificador independente. O destino é limitado a `reports/pi-execution/<nome>.jsonl`; travessia de diretórios e symlinks são rejeitados. `reports/` já é ignorado pelo Git.

Exemplo de evento terminal (ilustrativo, não é evidência de execução):

```json
{
  "schemaVersion": 1,
  "eventId": "cddfed7a-ff85-45b9-a4b1-80e1a6debe01",
  "executionId": "f9b1b6d2-ea18-4eea-8f78-b1712fdced1f",
  "operationId": "b2ade980-5da3-4e21-a8b1-e8d6d42c1234",
  "sequence": 2, "timestamp": "2026-10-29T12:00:00.000Z",
  "source": "pi-validate", "phase": "validation",
  "type": "validation.completed", "status": "completed",
  "durationMs": 35, "details": {"channel": "stable", "valid": true, "issueCount": 0}
}
```

## Limites e verificações

Cada operação registra início e término quando o processo encerra normalmente. SIGKILL, interrupção da máquina e I/O interrompido podem deixar início sem evento terminal: interpretar como **desconhecido**, nunca sucesso. Não há ordem global garantida para gravações entre processos; agrupar por executionId/operationId e usar timestamp/sequence somente como pistas.

Não há upload, artifact de CI, retenção automática ou backend de monitoramento. Definir retenção e acesso antes de centralizar logs. Eventos são diagnósticos, não comprovam aprovação, autorização, E2E ou correção da saída do modelo.

Verificar com `node --test tests/execution-events.test.mjs`, `npm run test:offline`, `npm run docs:check`, `npm run semantic:check`, `npm run semantic:report` e validate/build com dependências instaladas. Consultar o [modelo de ameaças E09](pi-agent-threat-model.pt-BR.md).
