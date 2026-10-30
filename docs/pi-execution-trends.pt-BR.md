[English](pi-execution-trends.md) | [Português](pi-execution-trends.pt-BR.md)

# E10 — Painéis e tendências offline do Pi

Os relatórios **reutilizam o JSONL local validado e o mesmo agregador** de [métricas E10](pi-execution-metrics.pt-BR.md). Não criam infraestrutura de monitoramento, APIs, permissões, chamadas de modelo, dependências nem uploads no CI; arquivos locais seguem a [política de retenção E10](pi-execution-log-policy.pt-BR.md). O painel não é incorporado à aplicação pública para não expor os logs locais ao navegador ou à publicação.

## Gerar os relatórios

Primeiro habilite a coleta opcional descrita em [eventos E10](pi-execution-events.pt-BR.md). Na raiz do projeto:

~~~bash
npm run pi:trends -- --period=day
npm run pi:trends -- --period=week --limit=12 --format=csv > reports/pi-execution/trends.csv
npm run pi:trends -- --period=month --format=html > reports/pi-execution/dashboard.html
npm run pi:trends -- --format=json > reports/pi-execution/trends.json
~~~

Abra o HTML gerado localmente no navegador; ele não precisa de JavaScript, recursos de terceiros nem conexão. O comando apenas envia conteúdo ao **stdout**; o redirecionamento pelo shell grava em reports/, ignorado pelo Git. Não redirecione a saída para o próprio JSONL de entrada. Por padrão, lê reports/pi-execution/events.jsonl; --file=reports/pi-execution/<nome>.jsonl seleciona outra fonte local permitida. Um caminho explicitamente solicitado e inexistente gera erro; a ausência da fonte implícita produz relatório vazio e indisponibilidade explícita.

Opções: --period=day|week|month (UTC, padrão day); --limit=1..365 (últimos N **períodos observados**, padrão 30); --format=json|csv|html (padrão JSON); --include-evaluation (fotografia independente de avaliação, apenas em JSON/HTML).

## Painéis e interpretação

- Resultados por período: operações concluídas, falhas, bloqueios e **incompletas/desconhecidas** separados.
- Latência: p95 da duração de operações terminais em ms; não representa duração de ponta a ponta de processos concorrentes.
- Tokens: apenas contadores de entrada realmente retornados pelo Pi, com amostras; falta de dados é **N/D**, não zero. Tokens de saída e amostras constam no detalhamento, CSV e JSON.
- Validação: sucesso nas operações pi:validate / (concluídas + falhas), **não** indicador de qualidade visual ou acessibilidade.
- Detalhamento por fase: planejamento, seleção, geração e validação.
- --include-evaluation inclui **uma fotografia separada** de qualidade contratual da avaliação Pi (Zod/grafo/componentes), não uma tendência nem evidência correlacionada com a janela de eventos. Não é medida de qualidade semântica, UX ou visual.

As séries não preenchem períodos sem observações com zeros: datas ausentes são **desconhecidas**. Operações que cruzam meia-noite ficam no período UTC de **início**; terminais órfãos são incompletos e usam a data observada. O resumo visual corresponde somente aos últimos N períodos observados. O JSON informa a quantidade de eventos na fonte e se períodos mais antigos foram omitidos; CSV inclui somente agregados visíveis, sem IDs ou payloads.

## Segurança e verificações

O leitor rejeita caminhos externos a reports/pi-execution/, symlinks, arquivos não regulares, tamanho superior a 4 MiB, eventos vencidos (mais de 7 dias), eventos inválidos, duplicados e operações conflitantes. O painel e CSV não incluem eventos, requisitos, prompts, JSON de telas, caminhos ou UUIDs brutos. O HTML é estático, sem scripts externos e com CSP restritiva. Dados agregados locais ainda podem ser sensíveis: verifique acesso local, agendamento da limpeza, cópias exportadas e retenção independente do CI/provedor antes de coletá-los.

Verificar:

~~~bash
node --test tests/execution-events.test.mjs tests/execution-metrics.test.mjs tests/execution-trends.test.mjs
npm run test:offline
npm run docs:check
npm run semantic:check
npm run semantic:report
npm run validate
npm run build
~~~

O comando não executa avaliação remunerada do Pi. O E2E completo continua manual na main.
