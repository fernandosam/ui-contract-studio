[English](pi-isolation.md) | [Português](pi-isolation.pt-BR.md)

# E09 — Isolamento entre JSON Pi, renderização, ações e integrações

Quatro fronteiras verificadas separadamente:

1. **Geração:** Pi produz apenas telas e metadados JSON. Catálogo Zod, `graphErrors` e `npm run pi:validate` verificam tipos, eventos, ações, limites da árvore e caminhos seguros de estado. O guard de ferramentas Pi é uma heurística, **não um sandbox**.
2. **Renderização:** `SpecScreen` valida a spec antes de montar `Renderer`. JSON não pode injetar JSX, callbacks, URLs arbitrárias ou permissões adicionais; entradas inválidas falham de modo seguro.
3. **Ações locais:** o registry expõe ações internas de estado e feedback `buttonClick`, `formSubmit`, `linkClick`. Os três handlers de feedback revalidam parâmetros no despacho; não fazem HTTP, navegação externa ou submissão.
4. **Integrações externas:** `DataTable` consulta somente `loadDataPage`. `demo-processos` permanece local; `processos-api` é **negado por padrão**, mesmo com JSON válido. Somente o hospedeiro confiável pode passar `remoteDataEnabled={true}` para `SpecScreen`; a permissão não existe na spec nem nas ações Pi. O adaptador utiliza endpoint fixo de mesma origem, credenciais da mesma origem, bloqueio de redirecionamento e schemas limitados. O backend ainda exige autenticação, autorização e filtros de acesso. Adaptadores de submissão do servidor não são registrados como ações Pi.

`npm run check:boundaries` detecta APIs de rede diretas nas camadas de UI, importação indevida de serviços de submissão e uso de adaptadores de rede fora do componente DataTable revisado. `node --test tests/e09-isolation.test.mjs` testa permissões, ações, caminhos maliciosos e fronteiras. Execute também `npm run validate`, `npm run build` e E2E pertinente em ambiente preparado.

**Limitação:** é isolamento lógico da aplicação, **não** sandbox de processo ou sistema operacional. Um Pi com shell arbitrário precisa de ambiente de execução restrito separadamente, controles de rede/segredos, CI, proteção de branch e revisão independente. Nada aqui autoriza endpoints ou integrações de produção adicionais.
