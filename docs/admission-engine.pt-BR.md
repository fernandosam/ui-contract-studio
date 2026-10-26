[English](admission-engine.md) | [Português](admission-engine.pt-BR.md)

# Admission Engine — catálogo unificado por maturidade

O **manifesto oficial Pi** `pi-catalog/contracts.json` disponibiliza `entries`, inventário único que combina contratos já homologados e composições experimentais revisadas. A lista `contracts` mantém compatibilidade com consumidores estáveis; `experimentalContracts` contém as composições habilitáveis por opção explícita. Cada entrada experimental tem SHA-256 da implementação React + schema Zod estrito e permissões limitadas.

## Ciclo de vida

| Estado | Significado | Uso no Pi |
| --- | --- | --- |
| Experimental | Código e schema íntegros, CI de validação/build, E2E pendente | `--channel=experimental` |
| Homologado por E2E / estável para demos locais | Evidência completa no navegador, certificado persistido e fingerprint coincidente | Ambos os canais |
| Bloqueado/certificado obsoleto | Falha crítica ou fingerprint divergente | Sem promoção; a versão alterada volta ao experimental |

Por padrão, o Pi usa **somente componentes estáveis**. O uso experimental exige opção explícita; os adapters React realmente executam os componentes permitidos, não são apenas exemplos de documentação. O catálogo experimental não concede chamadas remotas, URLs livres, JSX arbitrário nem novos tipos de ação.

O inventário `entries` unifica descoberta, mantendo as duas listas compatíveis. Os 102 contratos estáveis anteriores e o `contracts.lock.json` preservam suas regras de revisão. Eles registram explicitamente `validation.e2e: not-recorded`: o acesso estável herdado **não significa** E2E comprovado.

## Comandos

~~~bash
npm run admission:sync
npm run admission:sync:check
npm run pi:zod-schema
npm run pi:context -- --types=TypedConfirmationDialog --channel=experimental --stdout
npm run pi:validate -- --file=pi-catalog/experimental-examples/TypedConfirmationDialog.json --channel=experimental
npm run admission:check
npm run validate && npm run build
~~~

Sem `--channel=experimental`, o exportador de contexto e o validador Zod recusam contratos pendentes. Integrações existentes continuam com `catalog` e `registry`; integrações experimentais opt-in utilizam `experimentalCatalog` e `experimentalRegistry`.

## Certificação automática após E2E

O workflow manual `E2E manual (main)` limpa evidências antigas, executa o E2E completo, valida dez cenários obrigatórios do TypedConfirmationDialog em desktop/mobile e publica o artefato pós-E2E. Depois roda `npm run admission:certify`, limitado ao GitHub Actions manual na `main` e com confirmação explícita. O certificado contém fingerprint do código, commit testado, digest das evidências e ID da execução.

O workflow grava `src/ui-catalog/admission-engine/certifications.json` e regenera `pi-catalog/contracts.json`, realizando commit na `main` com o token da automação. Se uma proteção de branch impedir o push, a promoção falha de forma segura e deverá seguir a política de integração protegida do repositório. Não se deve declarar homologação sem a publicação real do registro.

Modificar código React ou schema invalida automaticamente o vínculo com a certificação anterior, retornando à condição experimental. A certificação cobre comportamento local testado; não equivale a revisão manual de acessibilidade nem autoriza transações, exclusão de dados ou requisições externas.

Inicialmente o catálogo experimental contempla `AcknowledgedActionDialog`, `TypedConfirmationDialog`, `TeamMemberAccordion` e `CopyFeedbackButton`. Somente TypedConfirmationDialog possui protocolo de promoção completo. Os demais continuam experimentais até haver testes E2E específicos, com checagem negativa obrigatória.
