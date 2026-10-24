# Sandbox de testes conectados

A sandbox é um ambiente auxiliar para validar o projeto com **dependências reais, rede HTTPS e navegador**, não um atalho para presumir compatibilidade. Os scripts oficiais permanecem em `sandbox/` e não devem produzir lockfiles ou resultados de testes fictícios.

## Conectividade npm

~~~bash
npm run sandbox:registry:probe
UI_CONTRACT_STUDIO_NPM_REGISTRY=https://registry.npmmirror.com npm run sandbox:verify
~~~

É possível fornecer endpoints próprios por `UI_CONTRACT_STUDIO_NPM_REGISTRIES` (separados por vírgula). O script verifica DNS/TLS e salva detalhes em `reports/sandbox/npm-registry-probe.json`, sem alterar o registro npm global. O **registro de componentes shadcn/ui é distinto** do registro npm. Não desabilite verificação TLS nem utilize espelhos HTTP.

## Executar

No Linux/WSL:

~~~bash
bash sandbox/run-all-tests.sh
~~~

O script executa testes estruturais antes de tentar a rede, instala dependências, verifica primitivas shadcn, gera schemas, executa checks, lint, typecheck, build e testes Playwright. Logs em `reports/sandbox/run.log`; um bloqueio de DNS deve ser reportado como **não executado**, não como sucesso.

Em Docker:

~~~bash
docker build -f sandbox/Dockerfile -t ui-contract-studio-sandbox .
docker run --rm -v "$PWD/reports:/workspace/reports" ui-contract-studio-sandbox
~~~

O Docker também precisa de Internet para dependências e imagens base. O uso local do Playwright pela sandbox **não muda** a política do GitHub: o E2E completo é acionado manualmente na `main`.

## Evidências visuais

Para exemplos oficiais shadcn, utilize `npm run shadcn:official:capture` e `npm run shadcn:official:compare`, conforme [auditoria oficial](../docs/official-component-visual-audit.md). Capturas locais são diagnósticas; a aprovação visual requer correspondência de estados e revisão humana. As referências às antigas Galerias 1 e 2 correspondem a material **histórico retirado do produto**, não a uma etapa de validação vigente.

A [documentação de qualidade](../docs/development.md) distingue testes automáticos, E2E manual e homologação visual.
