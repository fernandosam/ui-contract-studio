# Contribuindo para o UI Contract Studio

1. Para alterações significativas em contratos, proponha uma issue antes do PR.
2. Use branch dedicada e mudanças focadas.
3. Para novas primitivas ou composições, registre origem e licença, orientações de uso, schema Zod estrito, versão, fixtures e testes.
4. Specs dos agentes nunca devem receber JSX, HTML, URLs, callbacks ou ações arbitrárias.
5. Execute `npm run test:offline`, `npm run validate` e `npm run build` quando possível; documente explicitamente qualquer etapa não executada.
6. Nunca inclua credenciais, informações pessoais, endereços internos ou componentes pagos sem licença de redistribuição.

A aprovação de CI não substitui revisão humana. Consulte [AGENTS.md](AGENTS.md), [admissão de componentes](docs/admissao-componentes.md) e [publicação](docs/publicacao-open-source.md).
