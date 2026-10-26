[English](composition-strategy.md) | [Português](composition-strategy.pt-BR.md)

# Contratos compostos e estratégia de dependências ReUI

O UI Contract Studio mantém o **catálogo Zod/Pi fechado**. Inspecionar código ou adicionar um exemplo ReUI não admite automaticamente um tipo Pi.

## Fontes de verdade

A [política de composições](../src/ui-catalog/composition-policy.json) distingue 13 extensões primitivas de 11 compostos React explícitos. O [manifesto gerado](../src/ui-catalog/extensions/composites/generated-manifest.json) define 37 composições declarativas. O explorador utiliza a mesma política, sem duplicar a relação de tipos.

- **Variação de primitiva:** evolua o schema existente para propriedades seguras; não duplique tipos Pi por estilo.
- **Composição estática:** utilize um template JSON aprovado e uma implementação React gerada.
- **Composição de comportamento/domínio:** utilize adapter React explícito, propriedades Zod semânticas estritas, estado/eventos controlados e aprovação independente.
- **Exemplo ReUI:** mantenha o React apenas na galeria até a admissão expressa e revisada de um contrato semântico distinto.

Os metadados não substituem revisão de origem/licença, fingerprints, testes ou aprovação humana.

## Comandos

~~~bash
npm run composites:inventory:check
npm run composites:inventory
npm run composites:impact -- --primitive=Button
~~~

O inventário gera reports/composition-analysis/manifest.json com dependências de primitivas por contrato e exemplo ReUI, sinais de implementação, classificação semântica e mapa reverso de impacto. A análise percorre imports e tipos de nós JSON: fornece **evidência estática, não homologação funcional/visual**.

## A cada novo exemplo ReUI

1. Preserve o exemplo como TSX numerado em src/ui-catalog/extensions/composites/; novos exemplos carregados sob demanda devem ter exportação default.
2. Registre família/ID na ordem correta em src/ui-catalog/reui-guidance.json e orientação traduzida com URL de origem em src/ui-catalog/reui-example-guidance.pt-BR.json.
3. Registre **decisão semântica explícita e revisada** em src/ui-catalog/reui-semantic-admissions.json: reutilizar primitiva, reutilizar composto, evoluir contrato, adiar integração ou associar contrato semântico já aprovado. Não aprove em massa.
4. Execute o inventário e a auditoria ReUI de fontes/hashes. Atualize a baseline revisada e verificações com contagens versionadas se a coleção crescer.
5. Execute testes offline, validação e build. Avalie interação, teclado, responsividade e fidelidade visual com o E2E manual e evidências registradas.

A ausência de TSX, orientação ou decisão bloqueia o CI. Novos exemplos Accordion, Button e Separator podem carregar pelo fallback do glob Vite, sem alteração das listas especializadas anteriores.

Referências: DatePicker (Calendar + Popover + Button com estado), OnboardingChecklist (Accordion + Badge semântico) e Login01 (template JSON gerado). Consulte [componentes](components.pt-BR.md) e [contratos semânticos ReUI](reui-semantic-contracts.pt-BR.md).
