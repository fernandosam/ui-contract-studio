[English](pi-workflow.md) | [Português](pi-workflow.pt-BR.md)

# Fluxo do Pi Agent

A orientação vigente está em [Agentes e Pi](agents.pt-BR.md) e na [skill UI Catalog](../.pi/skills/ui-catalog/SKILL.pt-BR.md).

Fluxo resumido:

1. Consulte `pi-catalog/contracts.json`, tipos aposentados e padrões aprovados.
2. Execute `npm run pi:zod-schema` e `npm run pi:context -- --types=Card,Button` com os tipos estritamente necessários.
3. Gere somente JSON com propriedades, eventos e ações do schema real; não utilize `--metadata-only` para geração.
4. Valide com `npm run pi:validate -- --file=<spec.json>`; resolva `issues[].pointer`.
5. Registre verificações reais e limitações. Nunca divulgue segredos ou trate demos de pagamento/autorização como serviços reais.

O `semanticName` ajuda a leitura; o nome público da propriedade continua sendo a chave Zod até migração formal.
