[English](web-performance.md) | [Português](web-performance.pt-BR.md)

# E11 — Avaliação de renderização, bundles, memória e dispositivos móveis

Esta suíte é **diagnóstica e opcional**, executada localmente. Não aprova automaticamente baselines, altera contratos Pi ou schemas Zod, aumenta permissões do Admission Engine nem adiciona gate obrigatório de CI. Complementa os [baselines de carga E11](../benchmarks/baselines/README.md), quando o trabalho pendente for integrado.

## Execução

Com Node.js 22+, dependências imutáveis instaladas por `npm ci` e Chromium via `npm run test:e2e:install`:

```sh
npm run perf:web:all
```

O comando constrói o frontend de **produção**, inspeciona `dist/`, inicia o `vite preview` em 127.0.0.1:4173, executa configuração Playwright **separada** e gera resumo Markdown. O E2E habitual permanece intacto.

Etapas independentes: `npm run perf:web:bundle`, `npm run perf:web:browser`, `npm run perf:web:report`. As duas primeiras recompilam; a última exige dez resultados recentes do navegador e o relatório correspondente de bundles.

Artefatos locais, ignorados pelo Git:

- `reports/web-performance/bundle.json`: inventário de todos os assets, JS/CSS em bytes brutos/gzip/Brotli, referências diretas do HTML (**limite inferior** de carregamento) e maiores chunks.
- `reports/web-performance/browser/{desktop,mobile}-*.json`: três navegações e cinco interações por cenário; heap JS via CDP, FCP/LCP/CLS, tarefas longas, bytes dos recursos, overflow horizontal, erros JS e requisições externas bloqueadas.
- `reports/web-performance/summary.md`: valores agregados e identificados como medições diagnósticas. Playwright anexa os JSONs individuais.

São cinco cenários: filtragem ReUI, descoberta de primitivas, prévia do composto Dashboard01, seleção de exemplo JSON e alternância de tema no login, executados em desktop e móvel (**10 casos**). No perfil móvel, Pixel 7 é **emulado** com CPU 4× mais lenta, latência de 150 ms e download de 1,6 Mbit/s; desktop não é limitado. A suíte bloqueia requisições externas e deve operar somente com dados públicos de demonstração.

## Interpretação e regressões

- Para aprovar uma baseline medida, documente commit, versões Node/Chromium, máquina, perfil de CPU/rede e repetições. Um único resultado não constitui referência homologada.
- Compare bundles com uma **referência realmente medida e revisada**: `node scripts/audit-web-performance.mjs --compare=CAMINHO_DO_BUNDLE_APROVADO.json`. O comando falha caso JS/CSS referenciado diretamente no HTML cresça mais de 15% em gzip ou o total JS/CSS cresça mais de 20% em gzip/Brotli. São limiares iniciais de comparação, **não** orçamento absoluto aprovado.
- Analise FCP, LCP, CLS, tarefas longas, carregamentos inicial/repetidos, p95 do **tempo total da automação Playwright** e amostras do heap JavaScript. Tempo de automação **não é INP**; variação pontual de heap **não prova vazamento de memória**.
- Investigue FCP/LCP ausentes (N/D), acesso externo inesperado, exceções, overflow horizontal e aumento de chunks. Confirme suspeitas em várias execuções reproduzíveis.
- JS/CSS referenciado por `index.html` não representa necessariamente todo o grafo de carregamento: imports transitivos, chunks sob demanda, fontes, compressão HTTP e cache exigem inspeção de rede em navegador real.

**Limitações:** emulação Pixel 7 não substitui dispositivo físico, consumo real de RAM, aquecimento, bateria ou condições reais de rede. `JSHeapUsedSize` mede apenas heap JS do Chromium, **não** memória total do processo/dispositivo. FCP/LCP podem não ser capturados e devem permanecer N/D. Não há números reais de desempenho até a suíte ser executada com checkout completo, dependências e Chromium. O E2E completo permanece manual na `main`; certificação visual depende de inspeção humana de capturas reais.

## Verificações

```sh
node --test tests/web-performance.test.mjs tests/web-performance-report.test.mjs
npm run test:offline
npm run docs:check
npm run semantic:check
npm run semantic:report
npm run validate
npm run build
npm run perf:web:all
```

Não integrar apenas com checagem estática: preservar resultados executados e separar evidências medidas de validações pendentes.
