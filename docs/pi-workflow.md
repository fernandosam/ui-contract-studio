# Fluxo do Pi Agent

1. Consulte `pi-catalog/contracts.json`, incluindo `configuredContentFields` e rótulos semânticos de referência.
2. Gere o JSON Schema do Zod real com `npm run pi:zod-schema`; nunca infira APIs pela aparência visual.
3. Selecione apenas os tipos necessários: `npm run pi:context -- --types=Card,ShippingAddress`.
4. Gere uma spec JSON usando apenas os 163 tipos aprovados, propriedades/eventos explicitamente autorizados e os **nomes de chaves canônicos** de cada `props.content`.
5. Valide `npm run pi:validate -- --file=...`; interprete os caminhos e erros específicos antes de editar arquivos.
6. Execute os checks relevantes, compile e valide comportamento em navegador. Registre falhas e limitações.

O manifesto pode exibir um `semanticName` legível para auxiliar na escolha de campos, mas o nome validado/publicado continua sendo a chave original até uma migração formal da API. Isso evita alterar as 96 composições publicamente sem revisão independente. Nunca envie dados sigilosos ou credenciais ao agente.
