[English](admission-engine.md) | [Português](admission-engine.pt-BR.md)

# Admission Engine — catálogo unificado por maturidade

O **manifesto oficial Pi** `pi-catalog/contracts.json` utiliza `schemaVersion: 3` e uma única coleção `components` para os 106 contratos (102 de base/extensão e quatro composições geradas). Cada componente declara seu `lifecycle` (`stable` ou `experimental`) e suas evidências. Os experimentais incluem SHA-256 da implementação React/Zod e protocolo E2E próprio. Os arrays antigos `contracts`, `experimentalContracts` e `entries` foram **removidos**, sem fallback de compatibilidade.

## Ciclo de vida

| Estado | Significado | Uso no Pi |
| --- | --- | --- |
| Experimental | Código e schema íntegros, CI de validação/build, E2E pendente | `--channel=experimental` |
| Homologado por E2E / estável para demos locais | Evidência completa no navegador, certificado persistido e fingerprint coincidente | Ambos os canais |
| Bloqueado/certificado obsoleto | Falha crítica ou fingerprint divergente | Sem promoção; a versão alterada volta ao experimental |

Por padrão, o Pi usa **somente componentes estáveis**. O uso experimental exige opção explícita; os adapters React realmente executam os componentes permitidos, não são apenas exemplos de documentação. O catálogo experimental não concede chamadas remotas, URLs livres, JSX arbitrário nem novos tipos de ação.

`components` é o **único** inventário publicado para o Pi: interface, seletor de contexto, validadores e testes consultam essa lista. Os 102 contratos de base/extensão e o `contracts.lock.json` mantêm as regras de revisão de origem, sem formatos de manifesto alternativos. Eles registram explicitamente `validation.e2e: not-recorded`: o acesso estável herdado **não significa** E2E comprovado.

## Comandos

~~~bash
npm run admission:sync
npm run admission:sync:check
npm run pi:zod-schema
npm run pi:context -- --types=TypedConfirmationDialog --channel=experimental --stdout
npm run pi:validate -- --file=pi-catalog/experimental-examples/TypedConfirmationDialog.json --channel=experimental
npm run admission:check
npm run admission:evidence:reset
npm run test:admission:candidates
npm run admission:evidence:report
npm run validate && npm run build
~~~

Sem `--channel=experimental`, o exportador de contexto e o validador Zod recusam contratos pendentes. Integrações existentes continuam com `catalog` e `registry`; integrações experimentais opt-in utilizam `experimentalCatalog` e `experimentalRegistry`.

## Certificação automática após E2E

O workflow manual `E2E manual (main)` limpa evidências antigas, executa o E2E completo, valida dez cenários obrigatórios do TypedConfirmationDialog em desktop/mobile e publica o artefato pós-E2E. Depois roda `npm run admission:certify -- --candidate=form-declarative`, limitado ao GitHub Actions manual na `main` e com confirmação explícita. O certificado contém fingerprint do código, commit testado, digest das evidências e ID da execução.

O workflow gera `src/ui-catalog/admission-engine/certifications.json` e `pi-catalog/contracts.json` para **somente o candidato selecionado**, envia uma branch `admission/certify-...` separada e abre um **Pull Request em rascunho**. Nunca executa push direto na `main` protegida. A revisão humana do diff de dois arquivos, o CI e o merge são necessários para efetivar o certificado. A execução do GitHub Actions apenas prepara provas: **não** certifica o repositório antes do merge. A falta de permissão para criar PRs pelo Actions bloqueia a etapa; consultar a T36 abaixo.

Modificar código React ou schema invalida automaticamente o vínculo com a certificação anterior, retornando à condição experimental. A certificação cobre comportamento local testado; não equivale a revisão manual de acessibilidade nem autoriza transações, exclusão de dados ou requisições externas.

Inicialmente o catálogo experimental contempla `AcknowledgedActionDialog`, `TypedConfirmationDialog`, `TeamMemberAccordion` e `CopyFeedbackButton`. As quatro composições possuem agora protocolos individuais de E2E (desktop/mobile), mas permanecem **experimentais até que o workflow manual na main produza certificados válidos**. A promoção é vinculada ao fingerprint de cada contrato. Falha de qualquer cenário no E2E completo impede a certificação daquela execução; nenhuma aprovação é inferida da CI da PR.

## Protocolos de navegador dos quatro candidatos

O protocolo anterior de `TypedConfirmationDialog` preserva seus 5 casos desktop/mobile (10 execuções). Os novos protocolos independentes contêm 3 cenários por candidato e plataforma (18 execuções adicionais): `AcknowledgedActionDialog` (marcação obrigatória, cancelamento/reset e teclado), `TeamMemberAccordion` (conteúdo local, teclado e responsividade) e `CopyFeedbackButton` (cópia explícita, permissão negada e teclado). As evidências ficam separadas por candidato em `reports/composition-validation/admission/`.

A CI da PR executa os novos testes e relatórios, mas **não certifica** o catálogo estável. Somente `E2E manual (main)`, após recomeçar os diretórios de evidência, executar a suíte completa e validar os resultados da versão atual, pode gravar certificados na `main`. Se a política de proteção impedir o push do bot, a gravação deverá ser aprovada pelo fluxo do repositório. A execução manual não foi iniciada nesta implementação.

## Simplificação sem compatibilidade retroativa

- `tier` classifica **origem** (`base`, `extension` ou `composition`); somente `lifecycle` determina uso estável ou experimental. Uma composição homologada mantém seu tier.
- O runtime lê o manifesto oficial v3 para selecionar os contratos autorizados, e os dois canais compartilham uma única rotina de validação Zod estrita.
- Todos os quatro protocolos, inclusive TypedConfirmationDialog, utilizam `scripts/admission-evidence.mjs`, com evidência de código, projeto, caso e revisão testada. Não existem mais gates de piloto ou aliases de promoção.
- O lock de contratos utiliza apenas fingerprints **semânticos**. O histórico de contratos retirados pode continuar documentado, mas não funciona como compatibilidade de geração.
- `content` e `nodeProps` permanecem válidos enquanto forem APIs documentadas e utilizadas: `content` configura campos semânticos e `nodeProps` configura propriedades estruturadas de nós. Sua retirada requer uma migração de API própria e testes de todas as composições.

## T24 — avaliação semântica de admissão somente para consulta

A camada de conhecimento T22/T23 alimenta a avaliação **diagnóstica e não executável** da T24 por `scripts/lib/semantic-admission-review.mjs`. A integração reconstrói do código as lacunas auditadas e as propostas, confronta identidade dos cenários, dependências primitivas aprovadas, receitas revisadas, entradas oficiais do catálogo, protocolos e manifesto Pi v3, e **reutiliza a política oficial do Admission Engine**. Não existe atalho semântico para allowlist, tipo Pi, schema ou certificado E2E.

`npm run admission:check` executa essa avaliação. `npm run admission:publish` também gera `dist/admission/experimental/semantic-review.json` como **relatório auxiliar isolado**; o `catalog.json` executável continua exclusivamente subordinado à allowlist existente, à integridade do gerador, à ativação experimental explícita e aos protocolos vinculados ao código. A proposta semântica pode coincidir com um contrato experimental **já admitido**, mas a coincidência *não* constitui nova admissão ou ativação. Faltas de allowlist, origem não verificada, alvos divergentes, dependências não aprovadas, implementação sem revisão e protocolos inválidos permanecem bloqueados. Lacunas sem cenário revisado continuam sem composição; receitas já permitidas que não possuam lacuna T23 não são revogadas nem reclassificadas automaticamente.

Os candidatos semânticos apenas documentados (incluindo Combobox, Command e Sheet) constam como registros `documentation-only`, sem geração de receita, entrada de catálogo ou habilitação.\n\nO relatório separa `documentation`, `recommendation`, `proposal`, `decision` e o ciclo de vida real `existingPi.lifecycle`. Cada avaliação nega explicitamente ativação semântica, publicação de novo tipo Pi e certificação E2E. Verificações: `node --test tests/semantic-admission-t24.test.mjs`, `npm run admission:check`, `npm run semantic:check` e `npm run semantic:report`. Os dois comandos semânticos mantêm suas saídas consultivas da T22/T23; a T24 não acrescenta permissões Pi, mudanças Zod nem APIs executáveis. E2E em navegador, revisão independente de contrato e certificação manual confiável na main continuam obrigatórios.

## T36 — Certificação seletiva via PR protegido

A emissão de certificados não pode contornar o ruleset ativo da `main`. Em **Actions → E2E manual (main) → Run workflow**, selecione a branch `main`, o candidato **`form-declarative`** e marque a confirmação explícita `certify_confirm`. É proibida seleção `all` ou múltiplos candidatos. Os comandos `npm run admission:promote -- --candidate=form-declarative` e `npm run admission:certify -- --candidate=form-declarative` falham fora do contexto autorizado, sem evidências do navegador ou com SHA divergente.

O workflow executa todo E2E na revisão exata, limpa evidências antigas, confere os protocolos de desktop/mobile e respectivos arquivos, produz somente o certificado selecionado e gera **PR em rascunho** para a `main`. O PR contém apenas `src/ui-catalog/admission-engine/certifications.json` e `pi-catalog/contracts.json`. Não existe push direto na `main`, merge automático ou concessão de APIs Zod, URLs e permissões. Revisar manualmente fingerprint, protocolo, hashes de evidências, URL da execução, ausência de submissão remota, alterações de ciclo de vida e as duas verificações obrigatórias antes de marcar o PR como pronto e integrá-lo.

**Administração GitHub:** habilitar em **Settings → Actions → General** a opção de permitir que o GitHub Actions crie Pull Requests. O token do próprio workflow abre o PR, mas não dispara o evento `pull_request`; por isso o job executa `gh workflow run quality.yml --ref <branch>`, usando a entrada `workflow_dispatch` no workflow de qualidade existente. É necessário permitir `actions:write`, `contents:write` e `pull-requests:write` exclusivamente no job de certificação. Se a criação de PR ou o disparo de CI falhar, **não** declarar certificação; a branch proposta não é integrada. Os checks obrigatórios continuam protegendo a `main`.

**Limites:** aprovação de check, prévia e relatório do mesmo gerador não são provas independentes suficientes; usar a suíte manual E2E, os protocolos com origem e revisão verificadas, inspeção independente e decisão humana. A issue #62 só deve ser fechada após PR do certificado aprovado e mesclado, não após este ajuste de pipeline.
