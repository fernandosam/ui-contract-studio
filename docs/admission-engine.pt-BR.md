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

`components` é o **único** inventário publicado para o Pi: interface, seletor de contexto, validadores e testes consultam essa lista. Os 102 contratos anteriormente aprovados e o `contracts.lock.json` mantêm suas regras de revisão de origem, mas não uma API de manifesto legado. Eles registram explicitamente `validation.e2e: not-recorded`: o acesso estável herdado **não significa** E2E comprovado.

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

O workflow manual `E2E manual (main)` limpa evidências antigas, executa o E2E completo, valida dez cenários obrigatórios do TypedConfirmationDialog em desktop/mobile e publica o artefato pós-E2E. Depois roda `npm run admission:certify`, limitado ao GitHub Actions manual na `main` e com confirmação explícita. O certificado contém fingerprint do código, commit testado, digest das evidências e ID da execução.

O workflow grava `src/ui-catalog/admission-engine/certifications.json` e regenera `pi-catalog/contracts.json`, realizando commit na `main` com o token da automação. Se uma proteção de branch impedir o push, a promoção falha de forma segura e deverá seguir a política de integração protegida do repositório. Não se deve declarar homologação sem a publicação real do registro.

Modificar código React ou schema invalida automaticamente o vínculo com a certificação anterior, retornando à condição experimental. A certificação cobre comportamento local testado; não equivale a revisão manual de acessibilidade nem autoriza transações, exclusão de dados ou requisições externas.

Inicialmente o catálogo experimental contempla `AcknowledgedActionDialog`, `TypedConfirmationDialog`, `TeamMemberAccordion` e `CopyFeedbackButton`. Os quatro candidatos possuem agora protocolos individuais de E2E (desktop/mobile), mas permanecem **experimentais até que o workflow manual na main produza certificados válidos**. A promoção é vinculada ao fingerprint de cada contrato. Falha de qualquer cenário no E2E completo impede a certificação daquela execução; nenhuma aprovação é inferida da CI da PR.

## Protocolos de navegador dos quatro candidatos

O protocolo anterior de `TypedConfirmationDialog` preserva seus 5 casos desktop/mobile (10 execuções). Os novos protocolos independentes contêm 3 cenários por candidato e plataforma (18 execuções adicionais): `AcknowledgedActionDialog` (marcação obrigatória, cancelamento/reset e teclado), `TeamMemberAccordion` (conteúdo local, teclado e responsividade) e `CopyFeedbackButton` (cópia explícita, permissão negada e teclado). As evidências ficam separadas por candidato em `reports/composition-validation/admission/`.

A CI da PR executa os novos testes e relatórios, mas **não certifica** o catálogo estável. Somente `E2E manual (main)`, após recomeçar os diretórios de evidência, executar a suíte completa e validar os resultados da versão atual, pode gravar certificados na `main`. Se a política de proteção impedir o push do bot, a gravação deverá ser aprovada pelo fluxo do repositório. A execução manual não foi iniciada nesta implementação.
