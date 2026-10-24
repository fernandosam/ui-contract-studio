# Sandbox isolado de testes (v0.22)

Esta sandbox é **reproduzível, mas exige acesso à Internet** para os pacotes npm e os componentes shadcn. O projeto não distribui um `node_modules` artificial nem um `package-lock.json` inventado.

## Registries npm alternativos (HTTPS)

```bash
npm run sandbox:registry:probe
# Ao detectar um registry alcançável, o runner usa npm_config_registry somente no processo:
UI_CONTRACT_STUDIO_NPM_REGISTRY=https://registry.npmmirror.com npm run sandbox:verify
# Também é possível priorizar vários endpoints próprios, sempre com HTTPS:
UI_CONTRACT_STUDIO_NPM_REGISTRIES=https://registry.npmmirror.com,https://registry.yarnpkg.com npm run sandbox:verify
```

O script testa o pacote `react` e seu `version` em `/react/latest` antes de escolher. Ele exige TLS válido e registra erros em `reports/sandbox/npm-registry-probe.json`; não altera configurações globais. O `shadcn:install` **ainda precisa acessar o registry oficial de componentes UI**, que não é a mesma coisa que o npm registry. Em redes empresariais, configure DNS, proxy confiável ou o repositório npm interno aprovado. Não usar `strict-ssl=false` nem mirror HTTP. Mesmo com espelho, não considere o projeto homologado até a execução real de `npm ci`, TypeScript, Vite e Playwright.

## Opção 1 — WSL / Linux

```bash
bash sandbox/run-all-tests.sh
```

O script primeiro executa os testes offline. Quando o DNS do npm está disponível, instala dependências, executa o CLI oficial shadcn, produz um lockfile **apenas com os pacotes reais**, usa `npm ci` e executa catálogos, Zod, lint, testes, typecheck, build e Playwright. Também produz capturas locais dos 64 cards, separadas por desktop/mobile. Logs em `reports/sandbox/run.log`.

## Opção 2 — Docker

```bash
docker build -f sandbox/Dockerfile -t ui-contract-studio-sandbox .
docker run --rm -v "$PWD/reports:/workspace/reports" ui-contract-studio-sandbox
```

> O Docker **também precisa de acesso à Internet** para apt e npm. Os resultados de build e screenshots referem-se aos componentes instalados naquela execução. Para reproduzir em CI, versione o `package-lock.json` obtido de uma instalação genuína e as primitivas oficiais em `src/components/ui/`.

## Referências e comparação visual

Após uma execução conectada, o Playwright salva **64 arquivos PNG por viewport** em `reports/gallery-fidelity/local/desktop/` e `/mobile/`.

As capturas correspondentes do shadcn/create devem ser obtidas e revisadas manualmente, na mesma resolução, variante Base UI e tema, sendo salvas em `reports/gallery-fidelity/reference/{desktop,mobile}/<NomeDoCard>.png`.

```bash
npm run gallery:visual:capture
npm run gallery:visual:compare
```

A comparação só calcula diferenças de pixels para arquivos presentes e com dimensões iguais. **Não aprova automaticamente fidelidade**: datas, fontes, dados e tema precisam coincidir e um revisor deve inspecionar as diferenças. A falta de PNGs oficiais **faz a comparação falhar**, não permite declarar sucesso.
