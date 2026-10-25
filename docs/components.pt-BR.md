[English](components.md) | [Português](components.pt-BR.md)

# Componentes e contratos

## Inventários independentes

| Inventário | Uso | Fonte de verdade |
| --- | --- | --- |
| **Pi/json-render** | Tipos admissíveis em specs JSON | `src/ui-catalog/contracts.lock.json` e `pi-catalog/contracts.json` |
| **shadcn/ui (Base UI)** | Implementações locais de primitivas | `shadcn-plan.json` e `src/components/ui/` |
| **ReUI** | Composições React e exemplos visuais | `src/ui-catalog/extensions/composites/reui-composite-definitions.ts` |

Consulte [componentes compostos](componentes-compostos.md), [biblioteca ReUI](reui-composite-library.md) e [integração shadcn](integracao-shadcn.md). Uma primitiva instalada não é automaticamente um tipo Pi.

## Admissão de um tipo Pi

1. **Demonstre a lacuna.** Busque um equivalente aprovado e prefira combinar primitivas existentes.
2. **Defina a API.** Nome PascalCase único e schema Zod `z.object(...).strict()` em `src/ui-catalog/extensions/catalog.ts`. Declare props serializáveis e eventos/slots apenas quando necessários.
3. **Implemente.** Estado/comportamento próprios exigem componente React em `extensions/components/` e adapter tipado em `extensions/registry.tsx`. Composição estática deve usar template e gerador, sem wrappers TSX redundantes.
4. **Versione.** Registre origem e licença em `sources.json`, versão/fingerprint no lock, exemplos Pi e fixtures derivadas da fonte. O valor `approved` não comprova revisão independente.
5. **Teste e revise.** Cubra validação Zod positiva/negativa, acessibilidade, estados, temas, responsividade e eventuais efeitos. Execute `npm run contracts:check`, `npm run validate`, `npm run build` e revisão visual adequada. Obtenha revisão humana **antes** de liberar o tipo.

Proibidos JSX/HTML, callbacks, CSS arbitrário, URLs não autorizadas e permissões implícitas ao backend dentro de specs de agentes.

## Manutenção de composições

Edite os templates e `generated-manifest.json`, sem alterar diretamente `src/ui-catalog/extensions/generated/`. Ao mudar a estrutura aprovada, regenere os arquivos afetados e revise contratos, fixtures e fingerprints:

~~~bash
npm run composites:node-props:generate
npm run composites:generate
npm run composites:generated:check
npm run composites:check
npm run contracts:check
~~~

Um template não permite ações/URLs arbitrárias via `nodeProps` ou `content`. Confira fontes oficiais e capturas pela [metodologia visual](revisao-visual-shadcn.md). A [cobertura shadcn de 23/10/2026](shadcn-upstream-coverage.md) é apenas um levantamento histórico.
