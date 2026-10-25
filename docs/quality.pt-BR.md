[English](quality.md) | [Português](quality.pt-BR.md)

# Qualidade e homologação

Este caminho permanece por compatibilidade com links existentes. O **guia vigente** é [Desenvolvimento e qualidade](development.pt-BR.md), que descreve os comandos reais, o CI, o E2E manual e a auditoria visual.

Resumo: execute `npm run test:offline` e `npm run docs:check` para documentação; `npm run validate` e `npm run build` no ambiente completo. A job de qualidade valida PRs e pushes em `main`; o E2E completo possui workflow **manual na main**. Nenhum desses checks, isoladamente, comprova equivalência visual.
