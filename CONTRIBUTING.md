# Contribuindo para o UI Contract Studio

1. Para mudanças relevantes na API de contratos, abra uma issue antes do PR. Trabalhe em uma branch dedicada, com alterações pequenas e descritas.
2. Reutilize componentes existentes. Para adicionar um contrato, siga a [admissão de componentes](docs/components.md): schema Zod estrito, origem/licença, React/registry quando necessário, exemplos e testes.
3. Mantenha telas de agentes em JSON: sem JSX, HTML, callbacks, URLs arbitrárias ou integrações não autorizadas. Não inclua credenciais, dados pessoais ou recursos de terceiros sem licença.
4. Execute \`npm run test:offline\`, \`npm run docs:check\` se alterar documentação, \`npm run validate\` e \`npm run build\` em ambiente preparado. Descreva claramente qualquer etapa não executada.
5. Solicite revisão humana para mudanças em catálogo, manifestos e contratos. Um CI verde não comprova aprovação de segurança ou fidelidade visual.

Consulte [AGENTS.md](AGENTS.md), o [guia de desenvolvimento](docs/development.md), a [governança](docs/governance.md) e a [política de segurança](SECURITY.md).
