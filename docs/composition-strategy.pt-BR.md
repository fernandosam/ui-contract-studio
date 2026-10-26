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

Para páginas ReUI futuras, o conteúdo Markdown oficial pode ser salvo pelo revisor e processado localmente, sem depender da rede no CI. O importador gera **somente propostas** em reports/composition-analysis/proposals/ e nunca modifica automaticamente src/ui-catalog/knowledge/ ou o manifesto Pi:

~~~bash
npm run semantic:ingest -- --component=AlertDialog --file=reports/reui-source/alert-dialog.md
~~~

Revise seções, trechos originais e integrações candidatas; depois prepare um registro schemaVersion 1 com capacidades tipadas, evidências e testes, submetendo-o à revisão independente. O importador nunca executa instruções vindas da documentação externa.

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


## Primeiro piloto do motor de recomendações

No explorador **Primitivos shadcn**, utilize os atalhos **AlertDialog**, **Accordion** ou **Button** em "Analisar composição". O novo painel permite selecionar uma das 13 necessidades funcionais revisadas ou descrever a necessidade com uma frase conhecida. O motor é determinístico: só recomenda quando corresponde sem ambiguidades a uma expressão cadastrada; se a descrição for desconhecida ou combinar vários cenários, oferece seleção explícita.

A recomendação diferencia **reuso de contrato aprovado**, **candidato de componente React** e **revisão de autorização obrigatória**. Exibe justificativa, dependências permitidas, lacunas com evidência, riscos e plano de testes não executado. Não gera JSX, novos contratos Pi, ações de backend nem migrações automáticas.

Os pilotos avaliam confirmação simples/por checkbox/digitação e exclusão remota (AlertDialog), FAQ/onboarding/painel único/membros com avatar (Accordion) e ação simples/loading/cópia/grupos/toggle (Button). O indicador loading existente é reutilizado; copiar com feedback e confirmação digitada são candidatos, não funcionalidades já homologadas.

~~~bash
npm run composites:recommend:check
~~~

As regras do piloto são versionadas em [scenarios.json](../src/ui-catalog/recommendations/scenarios.json) e executadas por [engine.ts](../src/ui-catalog/recommendations/engine.ts). Novos cenários exigem revisão da adequação semântica, validação dos alvos no lock de contratos e testes. O painel não substitui revisão humana ou testes E2E.


## Geração automática de propostas de código (etapa posterior)

O motor de recomendações pode **gerar código React funcional e schemas Zod estritos em uma área isolada para revisão**, sem alterar o catálogo Pi. Somente os cenários classificados como react-candidate, com receitas explícitas em [recipes.json](../scripts/composition-codegen/recipes.json), são elegíveis. Atualmente são quatro: alert-checkbox (AcknowledgedActionDialog), alert-typed (TypedConfirmationDialog), accordion-members (TeamMemberAccordion) e button-copy (CopyFeedbackButton). Cenários de reutilização ou integrações remotas proibidas não são gerados.

~~~bash
# Validar todas as receitas, imports, schemas e sintaxe sem criar arquivos
npm run composites:generate:check

# Gerar somente um candidato
npm run composites:generate -- --id=alert-typed

# Gerar os quatro pacotes de propostas
npm run composites:generate -- --all

# Executar os testes Zod do pacote gerado
npx tsx --test reports/composition-proposals/alert-typed/TypedConfirmationDialog.schema.test.ts
~~~

Cada pacote é criado somente em reports/composition-proposals/<id>/ (ignorados pelo Git), com componente TSX, schema Zod, teste de fixtures válido/inválido, REVIEW.md e manifest.json com hashes SHA-256 e testes comportamentais **ainda não executados**. Saídas modificadas manualmente não são sobrescritas. O gerador só aceita IDs cadastrados e importa componentes de uma allowlist; não executa Markdown, exemplos externos, respostas de agentes ou texto arbitrário.

No explorador, selecione AlertDialog, Accordion ou Button e uma situação de **proposta React**. A opção "Código proposto" mostra as receitas TSX/Zod e permite copiá-las para revisão. Essa prévia não executa nem publica código.

**Definição de pronto para publicação:** revisão humana em PR separado, validação do schema e do comportamento com navegador/teclado/responsividade, revisão de acessibilidade e segurança, versionamento da API, registro explícito no registry/lock e testes de integração. *Gerar uma proposta não equivale a aprová-la*; o gate atual só atesta sintaxe, allowlists, proveniência e testes de schema. Uma edição dos arquivos gerados não altera o código-fonte ou a API Pi.



## Validação experimental de composições

As quatro composições revisadas são registradas no catálogo oficial Pi v3 desde a admissão estática. O ciclo de vida (`experimental` ou `stable`) é calculado a partir de certificados E2E vinculados ao fingerprint React/Zod. A prévia isolada de TypedConfirmationDialog permanece disponível para explorar o comportamento local sem backend, mas não possui mais um fluxo de homologação separado.

~~~bash
npm run admission:check
npm run admission:sync:check
npm run admission:evidence:reset
npm run test:composition:pilot
npm run test:admission:candidates
npm run admission:evidence:report
~~~

O mesmo verificador confere 28 execuções desktop/mobile dos quatro protocolos (10 do TypedConfirmationDialog e 18 dos demais), resultados e capturas, origem da implementação e revisão testada. A CI da PR valida os cenários focados, mas **não certifica** contratos para o canal estável. Somente o E2E manual completo na main pode gerar certificados. A ausência de chamada remota e as demais restrições de segurança permanecem obrigatórias. Revisão manual de acessibilidade não é inferida dos testes.

