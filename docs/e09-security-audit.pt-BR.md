[English](e09-security-audit.md) | [Português](e09-security-audit.pt-BR.md)

# E09 — Auditoria de dependências, segredos, logs e retenção

Revisão em 29/10/2026. Escopo: arquivos versionados do UI Contract Studio, serviços demonstrativos, avaliação Pi, dependências npm e GitHub Actions. Esta auditoria de código/política **não** comprova revisão do ambiente implantado, histórico Git completo, segredos configurados ou armazenamento dos provedores externos.

## Riscos identificados e controles

| Área | Risco encontrado | Controle / evidência |
| --- | --- | --- |
| Dependências npm | `npm ci --no-audit` garante instalação reproduzível, mas não verifica alertas de vulnerabilidade. | O `quality.yml` bloqueia vulnerabilidades altas+ de produção e críticas+ do conjunto completo com `npm audit`; Dependabot propõe atualizações revisadas, sem merge automático. |
| Cadeia de suprimentos Pi | Instalação não fixada do pacote descontinuado `@mariozechner/pi-coding-agent`. | Substituição por `@earendil-works/pi-coding-agent@1.4.0`, com versão explícita e `--ignore-scripts`. Cada atualização exige revisão de versão/dependências. |
| Segredos versionados | `.env` ignorado não impede credenciais hardcoded em outros arquivos. | `npm run security:check` detecta formatos de chaves de alta confiança, arquivos privados e artefatos sem prazo; mostra somente caminho/categoria. Habilitar secret scanning e push protection do GitHub quando disponíveis. Não cobre todo o histórico. |
| Logs e exceções Pi | Erros e saída bruta do CLI poderiam conter dados de prompts ou credenciais. | Relatos de falha usam códigos fixos, sem stderr bruto; relatórios usam categorias, não a saída original. Sem sessões, ferramentas, extensões de projeto, checagens de atualização ou telemetria no CI. |
| JSON bruto Pi | Especificações eram anexadas aos artefatos de CI. | Permanecem apenas no runner até a validação estrita, depois são apagadas; publicar somente métricas agregadas, por 7 dias. |
| Capturas e provas de testes | Screenshots/traces podem incluir valores de formulários. | Todos os uploads de artefatos passam a exigir expiração de até 14 dias. Testes devem utilizar apenas dados sintéticos. |
| Memória de demonstração | Serviço de exemplo guarda nome e e-mail; gateway guarda fingerprints/comprovantes até remoção por capacidade. | Limitar retenção dos registros de demonstração por tempo e quantidade; integrar TTL ao gateway após os PRs E09 de autorização em andamento. Até lá, não usar dados pessoais reais. |

## Classificação e políticas

- **Credenciais:** a chave `PI_EVAL_API_KEY` deve existir somente no step de execução. Adotar privilégio mínimo, rotação em caso de suspeita e nunca registrar o valor.
- **Prompts e specs:** tratados como potencialmente sensíveis. Apenas métricas agregadas, identificadores conhecidos e categorias de erro higienizadas podem sair do runner.
- **Nome/e-mail de demonstração:** somente dados fictícios. Integrações reais exigem base legal, isolamento por tenant, exclusão e prazo explícito na infraestrutura hospedeira.
- **Logs do GitHub Actions:** o prazo de logs é separado da retenção de artefatos; configurar duração mínima operacional no repositório/organização (meta: 14 dias) e restringir acesso.
- **Modelos externos:** a retenção e o processamento do provedor não são controlados por `--no-session` no CLI.

## Verificação

```sh
npm run security:check
npm run test:offline
npm audit --omit=dev --audit-level=high
npm audit --audit-level=critical
```

Os comandos `npm audit` precisam de acesso ao registro npm; falha de rede não é aprovação. Antes de produção, revisar políticas do GitHub e executar busca de segredos no histórico completo com ferramenta aprovada (ex.: Gitleaks). Corrigir alertas ou registrar decisão explícita; não ocultar códigos de saída.

## Limites e riscos pendentes

O projeto é demonstrativo, não um backend de identidade ou dados de produção. A camada de autorização do gateway está em PRs E09 ainda não integrados, portanto a evolução de TTL do cache de idempotência precisa ser realizada conjuntamente para evitar divergências. Auditar também backups, exclusões e contratos de retenção dos provedores reais. **Passar no check não amplia permissões do Pi.**
