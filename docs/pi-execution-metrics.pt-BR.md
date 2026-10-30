[English](pi-execution-metrics.md) | [Português](pi-execution-metrics.pt-BR.md)

# E10 — Métricas offline de execução do Pi

O comando analisa [eventos estruturados E10](pi-execution-events.pt-BR.md) **localmente**, sem executar o Pi, solicitar credenciais, ampliar permissões do catálogo nem transmitir dados. A saída é JSON no stdout e não grava arquivos.

## Captura e relatório

A coleta é opcional, por eventos locais e UUID compartilhado:

~~~bash
export UI_CONTRACT_EXECUTION_ID="$(node -e 'process.stdout.write(require("node:crypto").randomUUID())')"
export UI_CONTRACT_EVENTS_FILE=reports/pi-execution/events.jsonl
npm run pi:select -- --requirement="ação de botão" --types=Button
npm run pi:context -- --types=Button --metadata-only --stdout
npm run pi:metrics -- --execution-id="$UI_CONTRACT_EXECUTION_ID"
~~~

Para obter medidas de geração, a avaliação remunerada do Pi continua **manual e consentida**. Consultar a [avaliação Pi](avaliacao-pi.pt-BR.md): PI_EVAL_CONFIRM=yes e PI_EVAL_REPAIR_CONFIRM=yes para reparo opcional. O comando de métricas não realiza chamadas pagas.

~~~bash
npm run pi:metrics -- --file=reports/pi-execution/events.jsonl
npm run eval:pi:report
npm run pi:metrics -- --include-evaluation
~~~

A opção --include-evaluation lê reports/pi-evaluation.json **somente quando solicitada**. É uma evidência separada, sem pressupor correlação com o executionId. Para guardar o relatório, redirecionar o stdout; reports/ já é ignorado pelo Git.

## Definições

| Campo | Interpretação |
| --- | --- |
| operations | Operações observadas: concluídas, falhas, bloqueios e incompletas |
| latencyMs / byPhase.*.latencyMs | Duração medida por operação terminal (ms): amostras, média, p50, p95 |
| piGenerationAttempts | Chamadas reais de geração Pi: primeira tentativa/reparo consentido; sem término é incompleta |
| tokens.input/output | Contadores inteiros de uso **real** devolvidos pelo Pi, com amostragem por direção |
| contractValidation.passRate | Validações pi:validate bem-sucedidas / bem-sucedidas + falhas; não mede experiência do usuário |
| evaluationQuality | Avaliação Pi independente: sucesso inicial, após reparo e taxa de sucesso dos reparos, com não executados separados |

Sem amostras, os percentis, totais de tokens e taxas são **null (desconhecido), não zero**. Uma tentativa falha pode consumir tokens sem fornecer contadores recuperáveis. A cobertura da medição acompanha os totais, que não constituem contabilidade financeira completa. Durações são por operação, **não tempo de relógio total** de processos possivelmente concorrentes.

A avaliação Pi verifica Zod, invariantes de grafo e componentes exigidos. **Não** certifica semântica, qualidade visual, acessibilidade, satisfação do usuário nem E2E. Ausência de saída real não é aprovada.

## Privacidade e limitações

A lista fechada de metadados E10 passou a aceitar attempt (1 ou 2), inputTokens e outputTokens numéricos e limitados somente na fase de geração pi-eval. O uso de tokens só é aceito nos eventos terminais. Não se coletam prompts ou respostas do modelo. Registros inválidos/duplicados impedem a análise; interrupções contam como incompletas, nunca sucesso. Os arquivos devem ser JSONL locais regulares em reports/pi-execution/, sem symlinks ou travessia, com até 16 MiB. O relatório de avaliação também é local, limitado e ignorado pelo Git.

O mecanismo é **diagnóstico**, não monitoramento automático, autorização, evidência de admissão ou substituto de auditoria visual independente. Definir retenção e controle de acesso antes de armazenar logs.

## Verificação

~~~bash
node --test tests/execution-metrics.test.mjs tests/execution-events.test.mjs
npm run test:offline
npm run semantic:check
npm run semantic:report
npm run docs:check
npm run validate
npm run build
~~~
