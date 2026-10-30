[English](performance-baselines.md) | [Português](performance-baselines.pt-BR.md)

# E11 — Baselines locais de desempenho e carga

O executor E11 mede **fluxos reais da CLI**, sem simular respostas do Pi. Não chama modelos, envia formulários, altera catálogos, acessa serviços externos ou aprova contratos. A execução é manual/sob demanda; não acrescenta carga aos checks padrão do CI.

## Cenários representativos

| Cenário | Fluxo real | Trabalho coberto |
| --- | --- | --- |
| select-narrow | Seleção entre Button e AlertDialog | Inicialização, contratos, conhecimento semântico e justificativas |
| select-wide | Seleção Pi ampla | Catálogo revisado, pontuação e comparação |
| context-real-schema | Contexto de quatro componentes | JSON schemas reais e recomendações semânticas (sem metadata-only) |
| plan-simple | Cadastro demonstrativo básico | Planejamento, geração JSON e conformidade |
| plan-rich | Cadastro demonstrativo com múltiplos campos | Agrupamento de campos em duas colunas, geração JSON e conformidade |
| validate-screen | Tela JSON existente de login | Validação Zod e invariantes estruturais |

Os casos de cadastro gravam entradas fixas e não sensíveis temporariamente em reports/requirements/; os arquivos são excluídos ao final. A validação utiliza src/ui-screens/blocos-login.json. Alterações na tela, nos contratos ou na semântica mudam a carga: registre a revisão Git. Navegador, rede, geração com IA, tokens pagos e backend estão fora do escopo.

## Execução

Exige **Node.js 22+**, dependências instaladas conforme lockfile e máquina controlada/ociosa:

~~~bash
npm ci
npm run perf:baseline
# Execução exploratória (não é baseline aprovada):
npm run perf:baseline -- --iterations=5 --warmup=0 --concurrency=1 --scenarios=select-narrow,validate-screen --out=reports/performance/smoke.json
~~~

O padrão mede 20 processos por par cenário/concorrência, dois aquecimentos por grupo, concorrências **1 e 4**, timeout de 30 segundos/processo e limite de saída de 4 MB. Seis cenários totalizam 240 tentativas medidas, mais os aquecimentos. O JSON é escrito atomicamente em reports/performance/e11-latest.json, ignorado pelo Git. Opções: --iterations=5..200, --warmup=0..10, --concurrency=1,4 (de 1 a 8), --scenarios=..., --timeout-ms=100..120000 e --out=reports/performance/nome.json. Comandos, cenários e caminhos são restritos.

**As latências incluem a inicialização da CLI e dos módulos.** Cada amostra inicia um processo, e o pool compartilha N tentativas totais (não N por trabalhador). Aquecimentos não entram nas métricas. As saídas stdout/stderr são descartadas, e os eventos E10 são desativados nos processos medidos para evitar distorção e exposição. E2E de navegador e execução real do Pi continuam separados.

## Semântica dos relatórios

Cada registro (cenário, concorrência) possui tentativas, sucessos, falhas, falhas de aquecimento, taxa de erro, tempo total, throughput de **operações bem-sucedidas** por segundo e latências mínima/média/p50/p90/p95/p99/máxima, em milissegundos (percentil de posto mais próximo). Apenas amostras bem-sucedidas entram nos percentis; timeouts, saídas inválidas e erros ficam contabilizados. Falha de aquecimento impede a medição do grupo. Qualquer falha torna a coleta **incomplete** e retorna código diferente de zero. Dados desconhecidos ficam null, nunca zero inventado. Há arredondamento para duas casas decimais.

O relatório traz apenas IDs de cenários, agregados, instante UTC, versão Node, SO, CPU/modelo/quantidade, memória total e revisão Git quando disponível. Não inclui prompts, especificações JSON, stderr, credenciais, dados de caminhos particulares ou identificadores de execução. Pico de RSS/CPU, experiência do usuário no navegador e custo de tokens **não são medidos**.

## Aprovação e comparação

1. Execute o **perfil padrão pelo menos três vezes** na mesma máquina ociosa, com revisão, Node e lockfile idênticos. Confirme complete, zero falhas e examine a variação. Não selecione o resultado mais rápido por conveniência.
2. Submeta um JSON medido e representativo, revisado de forma independente, à pasta benchmarks/baselines/, documentando máquina, revisão, data e revisor na PR. Até isso ocorrer, **não existe baseline numérica aprovada**. Não publique estimativas ou dados simulados.
3. Em revisão posterior comparável, execute:

~~~bash
npm run perf:baseline -- --compare=benchmarks/baselines/referencia-aprovada.json
~~~

O comparador rejeita amostras incompletas e exige versão Node, SO/arquitetura, CPU/modelo/quantidade, iterações, aquecimentos, timeout e matriz cenário/concorrência iguais. Detecta aumento de p95 **superior a 20%** ou redução de throughput de sucesso **superior a 15%**. Falhas invalidam a comparação independentemente dos limiares. É sinal de investigação, **não** SLA de produção ou bloqueio automático de publicação: considere contenção, temperatura, inicialização e dispersão.

Consulte a [política da referência](../benchmarks/baselines/README.md) e os [eventos E10](pi-execution-events.pt-BR.md). Verifique com npm run test:offline, docs:check, semantic:check, semantic:report, validate e build quando houver dependências. E2E completo continua manual na main.
