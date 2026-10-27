# T17–T28 — Interfaces flexíveis orientadas por requisitos

Revisão inicial: 2026-10-27. [English](flexible-interfaces-t17-t28.md).

## T17 — Diagnóstico de limitações

A base vigente permite compor campos, layouts, tabelas, botões e diálogos utilizando contratos aprovados. Limitações observáveis no código: `Input.checks` declara restrições mas não executa validações de negócio; `AlertDialog` emite confirmação local e não salva dados; ações de formulário demonstrativas não fornecem backend. Não ampliar contratos por simples documentação.

A matriz versionada em `tests/fixtures/requirements-scenarios.json` possui doze situações: oito variáveis de cadastro demonstrativo que devem gerar specs estáticas válidas e quatro situações bloqueadas (persistência não especificada, backend não autorizado, validação de negócio e ausência de campos). O relatório executável `npm run requirements:audit` calcula as contagens a partir das implementações, e não equivale a E2E.

## Entrega 1 — T18/T19

`src/ui-requirements/composition-rules.json` referencia IDs de capacidade revisados, sem criar novo estado de implementação; `capabilities.ts` fornece busca no subconjunto piloto de overlays AlertDialog, Input, Select, Button e DataTable. Continua valendo a fonte de verdade dos contratos Zod e o lock. A descoberta semântica é consultiva.

## Entrega 2 — T20/T21/T22

`flows/registration.json` declara perguntas, padrões, condições e escolhas explícitas. `schema.ts` valida seu formato; `engine.ts` verifica respostas, visibilidade e origem (`explicit`/`default`). Persistência exige resposta explícita. `/?screen=criador-interfaces` oferece assistente visual. O piloto só reconhece cadastro.

## Entrega 3 — T23/T24/T25/T26

`planner.ts` reutiliza Card, Stack/Grid, Input, Button/AlertDialog; `generator.ts` monta árvore JSON sem JSX arbitrário, URLs livres ou efeitos remotos. `behavior.ts` oferece predicados/validação de valores tipados, mas **não os instala automaticamente no runtime Pi**. A variação de campos e layout não exige schema novo. Confirmação é independente do envio: prévia local, não confirmação integrada a gravação. `npm run requirements:preview -- --file=reports/requirements/answers.json` recebe `{"intent":"cadastro","answers":{"persistence":"local-demo"}}` e exibe relatório e spec. Não grava em `src/ui-screens` sem revisão.

## Entrega 4 — T27/T28

`verify.ts` invoca validação Zod do catálogo, invariantes de grafo e comparação estática da presença de campos e confirmação. `npm run requirements:test` e `npm run requirements:audit` cobrem os 12 cenários. Regras de validação nativa são **pendentes de verificação em navegador**, não homologadas. E2E completo permanece manual na main.

## Lacunas e critérios de evolução

1. Não declarar validação de negócio ou tratamento de erros como implementado: são contratos/comportamentos ausentes, que exigem tarefa separada e revisão.
2. Não declarar persistência: backend, autenticação, autorização e erro de servidor precisam de contratos explícitos.
3. Ampliar descoberta de cadastro para outros tipos de tela somente após casos representativos e testes independentes.
4. Para testes de comportamento real, acessibilidade e responsividade, executar navegador em ambiente conectado e registrar evidência.
5. As oito specs aceitas são **demonstrações estáticas**, não cadastros funcionais ponta a ponta.

## Verificações recomendadas

```bash
npm run requirements:test
npm run requirements:audit
npm run semantic:check
npm run contracts:check
npm run validate
npm run build
```
