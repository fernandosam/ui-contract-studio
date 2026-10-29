[English](semantic-catalog-discovery.md) | [Português](semantic-catalog-discovery.pt-BR.md)

# Descoberta semântica de componentes

Os catálogos **Primitivas** e **Compostos** compartilham uma implementação consultiva de descoberta. A busca utiliza nomes, descrições dos contratos, finalidades registradas e orientações positivas de **quando usar**. Acentos são normalizados e cada termo deve corresponder a uma fonte existente. A ordenação determinística prioriza nome, descrição e exemplos semânticos, nessa ordem. **Quando não usar**, sugestões, lacunas e capacidades não implementadas jamais se tornam evidência positiva de busca.

Os agrupamentos funcionais são uma heurística reproduzível baseada no nome, não um novo cadastro de autorização. Os filtros de finalidade, maturidade revisada e disponibilidade ao Pi podem ser combinados. A URL guarda `catalogSearch`, `catalogGroup`, `catalogStability` e `catalogPi`, mantendo a tela original; a ação Limpar filtros restaura os valores padrão.

A indicação de disponibilidade ao Pi exige que o lock revisado e o manifesto gerado coincidam quanto a versão, fingerprint, estabilidade e aprovação. A interface não altera contratos, schemas, evidências E2E, permissões nem o Admission Engine. A prévia continua validada pelo Zod.

Validação: verificações existentes de CI, testes offline, integração, tipagem, build e navegador. Novos testes: `tests/catalog-discovery.integration.test.ts` e `tests/e2e/semantic-catalog-discovery.spec.ts`.

## Comparação semântica no catálogo

Nas visões **Primitivas** e **Compostos → Contratos**, selecione um componente e clique em **Comparar semântica**. O seletor **Comparar com** mostra os demais contratos do mesmo catálogo. A comparação lado a lado apresenta finalidade, quando usar, quando evitar, versão, estabilidade, disponibilidade no Pi, origem dos dados e capacidades com seus estados. Também separa IDs documentais compartilhados e exclusivos: coincidência de ID **não** comprova APIs equivalentes; ausência de registro **não** comprova capacidade ausente. Capacidades com evidência estática não são apresentadas como homologadas em execução.

A comparação é consultiva, não salva alterações e não adiciona outra tela, aprovação ou fonte de verdade. O catálogo preserva as abas e o editor validados por Zod, sem modificar schemas, fingerprints, contratos admitidos ou permissões Pi. O link mantém `catalogComponent` e `catalogCompare` quando a comparação está aberta, além dos filtros já existentes; fechar a comparação remove esses parâmetros. Entradas sem conhecimento revisado mostram orientações parciais, em vez de inventar equivalência ou implementação.

Testes adicionais: `tests/semantic-comparison.integration.test.ts` e `tests/e2e/semantic-catalog-comparison.spec.ts` (desktop/móvel). Execute `npm run test`, `npm run typecheck`, `npm run build` e `npx playwright test tests/e2e/semantic-catalog-comparison.spec.ts`.
