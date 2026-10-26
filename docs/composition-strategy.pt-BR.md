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

O inventário gera reports/composition-analysis/manifest.json com dependências de primitivas por contrato e exemplo ReUI, sinais de implementação, classificação semântica e mapa reverso de impacto. A análise percorre imports e tipos de nós JSON: fornece **evidência estática, não homologação funcional/visual**. Também sugere evolução de primitiva, composição declarativa, composição React ou revisão de integração conforme dependências e comportamento identificados; sugestões não substituem decisões semânticas revisadas.

## A cada novo exemplo ReUI

1. Preserve o exemplo como TSX numerado em src/ui-catalog/extensions/composites/; novos exemplos carregados sob demanda devem ter exportação default.
2. Registre família/ID na ordem correta em src/ui-catalog/reui-guidance.json e orientação traduzida com URL de origem em src/ui-catalog/reui-example-guidance.pt-BR.json.
3. Registre **decisão semântica explícita e revisada** em src/ui-catalog/reui-semantic-admissions.json: reutilizar primitiva, reutilizar composto, evoluir contrato, adiar integração ou associar contrato semântico já aprovado. Não aprove em massa.
4. Execute o inventário e a auditoria ReUI de fontes/hashes. Atualize a baseline revisada e verificações com contagens versionadas se a coleção crescer.
5. Execute testes offline, validação e build. Avalie interação, teclado, responsividade e fidelidade visual com o E2E manual e evidências registradas.

A ausência de TSX, orientação ou decisão bloqueia o CI. Novos exemplos Accordion, Button e Separator podem carregar pelo fallback do glob Vite, sem alteração das listas especializadas anteriores.



## Enriquecimento semântico: orientações, capacidades e recomendações

O relatório agora inclui semanticKnowledge. **Cada família ReUI já inventariada** herda as orientações da família, enquanto extensões shadcn e contratos semânticos já aprovados reutilizam suas orientações atuais. O enriquecimento específico fica em src/ui-catalog/knowledge/; AlertDialog é o primeiro exemplo detalhado. Documentação não é permissão de API.

~~~bash
npm run semantic:check
npm run semantic:context -- --component=AlertDialog
npm run semantic:report
npm run composites:inventory
npm run pi:context -- --types=AlertDialog --metadata-only --stdout
~~~

Cada registro inclui URL da fonte, seções consultadas e data; finalidade, quando usar/evitar, notas do agente, integrações candidatas, capacidades, decisões de FAQ e casos de teste. Cada capacidade tem estado de evidência distinto:

- implemented-static-evidence: exige caminho de arquivo e trecho verificável de código próprio. Comprova **presença no código**, não qualidade de execução ou acessibilidade.
- documented-not-implemented: capacidade prospectiva, ainda não exposta no contrato; pode gerar proposta de composição revisável, nunca propriedade automática.
- runtime-review-required: comportamento que exige teste real em navegador, teclado, tecnologia assistiva, responsividade ou funcionalidade.

Uma integração candidata informa se o tipo pertence ao Pi e se a implementação analisada realmente o importa. Checkbox, Input, Alert ou Sonner sugeridos **não significam que já estejam no componente** nem concedem operações remotas, exclusões, props adicionais ou permissões. Dependências ainda não analisadas ficam como desconhecidas, não como ausentes.

O contexto Pi de tipos aprovados passa a incluir semanticAdvice delimitado à seleção; **propsSchema, actionSchemas e lock fechado continuam normativos**. Novos registros ricos devem citar documentação ReUI/shadcn e passar por validação de evidências no CI. Exemplos ReUI novos herdam orientações da família automaticamente; seções adicionais de funcionalidades, FAQ e integrações exigem curadoria e revisão. Informações da web nunca são tratadas automaticamente como evidência de implementação.

O AlertDialog atual sinaliza confirm e expõe variante visual destrutiva, mas **não implementa** confirmação condicionada por Checkbox ou digitação no contrato Pi. A camada registra essas lacunas e exige testes reais para validar foco, teclado e dispositivos móveis.

## Blocos shadcn oficiais: comparação do código-fonte com o template

O inventário também cobre todos os blocos oficiais cadastrados em [block-source-inventory.json](../src/ui-catalog/block-source-inventory.json). Os 27 blocos aprovados anteriormente têm 103 arquivos originais registrados em audits/upstream/shadcn-blocks/. Cada arquivo é validado contra seu hash Git blob e commit imutável definidos nos [pinos de origem](../src/ui-catalog/shadcn-block-source-pins.json). O analisador percorre imports de **todos os TSX oficiais versionados**, identifica estado/eventos/dependências externas e compara as primitivas originais com as utilizadas nos templates JSON locais. Diferenças aparecem em absentFromAdaptation e additionalInAdaptation; elas não são tratadas automaticamente como equivalência funcional.

O processo para novo bloco passa a ser:

1. Registre arquivos e links da fonte oficial em block-source-inventory.json e no inventário upstream. Não copie código de URLs arbitrárias.
2. Execute a sincronização com um commit imutável do repositório oficial. O comando registra snapshots originais, pinos e hashes Git. Não modifique manualmente o código original versionado.
3. Acrescente uma [decisão do bloco](../src/ui-catalog/shadcn-block-decisions.json) com implementation (declarative, react, reuse-primitive, defer) e reviewStatus (review-required ou reviewed). Novos blocos não podem alegar existing-approved. A admissão exige reviewer, reviewedOn e reviewReference. Candidatos pendentes não entram no lock ou registry do Pi.
4. Revise diferenças de dependências e a recomendação de implementação. Publique apenas após revisão expressa, contratos Zod/registry/origem/licença/versões/fixtures e testes visuais/de acessibilidade pertinentes. Identificar o revisor no JSON não substitui revisão humana do PR.

~~~bash
npm run shadcn:blocks:sources:sync -- --block=login-01 --ref=<SHA-oficial-de-40-caracteres>
npm run composites:inventory:check
npm run composites:impact -- --primitive=Button
npm run blocks:check
~~~

Os snapshots originais são **insumos de análise, não código incorporado ao runtime**. As 27 decisões legadas estão classificadas como existing-approved apenas para preservar os contratos anteriormente aprovados; isso não representa nova homologação humana ou visual. Falta de evidências e decisões bloqueia novos blocos, e candidatos pendentes não podem ser promovidos ao Pi.

Referências: DatePicker (Calendar + Popover + Button com estado), OnboardingChecklist (Accordion + Badge semântico) e Login01 (template JSON gerado). Consulte [componentes](components.pt-BR.md) e [contratos semânticos ReUI](reui-semantic-contracts.pt-BR.md).
