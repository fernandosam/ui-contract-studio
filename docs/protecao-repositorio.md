# Governança de catálogo em repositório compartilhado

O status `approved` **não comprova aprovação humana**; ele é somente metadado. Configure no GitHub/GitLab antes de confiar no pipeline:

1. Adapte `docs/CODEOWNERS.template` para usuários/equipes reais e salve em `.github/CODEOWNERS` (GitHub). Para GitLab, configure Code Owners correspondente.
2. Proteja a branch principal: PR/MR obrigatório, aprovação de code owner e proibição de bypass para agentes e contas comuns.
3. Marque o job `integration` como obrigatório; bloqueie merge se faltar lockfile, componentes, build ou Playwright.
4. Ao mudar schema/props/events, eleve a versão do contrato, revise todas as specs, atualize o fingerprint e o manifesto com revisão registrada.
5. Não permita ao Pi modificar `sources.json` ou `contracts.lock.json` sem revisão; o guard local ajuda, mas shell/Bash e administradores podem contorná-lo.
6. Use `CONTRACT_BASE_REF` no CI para comparar versões com a branch-base. O script **não verifica identidade/aprovação humana**; a plataforma de Git deve impor isso.

**Pendente fora do projeto**: dados reais de usuários/equipes responsáveis e ativação das regras no serviço de hospedagem. Nenhuma proteção remota foi alterada automaticamente.
