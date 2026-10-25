[English](protecao-repositorio.md) | [Português](protecao-repositorio.pt-BR.md)

# Proteção do repositório

A política vigente está em [Governança](governance.md). O arquivo [CODEOWNERS.template](CODEOWNERS.template) é apenas uma sugestão de configuração e **não significa que exista uma regra de branch ativa**.

Configure no GitHub a exigência de PR, checks de qualidade e revisão independente para alterações de contratos. O job `integration` verifica dependências, schemas, build e testes integrados, **não o Playwright completo**: o E2E é executado manualmente na `main`. Não torne o E2E um status obrigatório de PR se ele não é acionado em PRs.

A ferramenta Pi não pode autoaprovar `sources.json` ou `contracts.lock.json`. `approved` nesses arquivos é metadado; proteção e identidade de revisores devem ser verificadas na plataforma.
