[English](avaliacao-pi.md) | [Português](avaliacao-pi.pt-BR.md)

# Avaliação de geração do Pi (20 cenários)

A lista em `tests/prompt-evals/scenarios.json` contém prompts e os contratos mínimos esperados. **Os prompts não foram executados pelo Pi na entrega**. Não tratá-los como uma nota de qualidade do modelo.

1. Crie a pasta `eval-results/` (ignorada no Git).
2. Execute o Pi para cada cenário e salve **a spec JSON realmente produzida** no arquivo `eval-results/<id>.json`, sem alterar os tipos exigidos no cenário.
3. Execute `npm run eval:pi` para diagnóstico; ele registra `pass`, `fail` ou `not-run` em `reports/pi-evaluation.json`.
4. Execute `npm run eval:pi:strict` para exigir execução dos 20 cenários.
5. Avalie separadamente qualidade visual, semântica, segurança e tarefas reais; o verificador não mede esses critérios subjetivos.

O script não chama o Pi automaticamente e não tenta contornar aprovações nem fabricar specs para atingir nota máxima.
