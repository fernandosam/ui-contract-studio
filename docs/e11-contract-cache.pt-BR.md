[English](e11-contract-cache.md) | [Português](e11-contract-cache.pt-BR.md)

# E11 — Cache seguro de metadados públicos dos contratos

## Escopo e fonte de verdade

O explorador **Primitivas/Compostos** reutiliza exclusivamente o índice normalizado de **descoberta consultiva**. As identidades de cada entrada vêm de `src/ui-catalog/contracts.lock.json` (`version` + `semanticFingerprint`), transmitidas por `catalog-explorer.tsx` para `catalog-discovery.ts`. O cache é memória local do processo/aba: **não usa localStorage, IndexedDB, disco ou backend**.

A chave contém namespace, snapshot dos campos públicos relevantes (nome, descrição, finalidade, `whenUse`, maturidade e disponibilidade Pi) e **identidades exatas de todos os contratos** do índice. Troca isolada de versão, troca isolada de fingerprint ou alteração de orientação produz nova chave. Uma solicitação com metadados ausentes ou malformados não é armazenada. A implementação descarta entradas conflitantes imediatamente quando detecta mudança de identidade e também aplica TTL de cinco minutos e LRU de oito snapshots de índice.

## Política de segurança

- Somente classificação explícita `public-contract-derived`: índices de metadados revisados e públicos. **Não** armazenar consultas de usuários, prompts, respostas de LLM, specs geradas, tokens, credenciais, dados pessoais/multitenant, autorizações ou resultados de execução.
- A pesquisa e os filtros são calculados a cada consulta, usando os valores atuais. Nem a consulta nem a lista de resultados são cacheadas. O índice contém apenas texto público normalizado e grupo funcional.
- O utilitário `contract-cache.mjs` impõe limites de entradas, TTL, tamanho da chave, nomes e formato de versões/fingerprints. Copia valores na escrita e na leitura para impedir mutação indireta. Dados sem metadados válidos passam direto pela computação, sem cache.
- **Cache hit não autoriza componente**: disponibilidade Pi continua dependente da verificação existente entre lock revisado e manifesto publicado, estabilidade, status e schemas Zod. Não altera Admission Engine nem permissões.

## Verificação

```sh
node --test tests/contract-cache.test.mjs
npx tsx --test tests/catalog-discovery.integration.test.ts
npm run semantic:check
npm run semantic:report
```

As verificações incluem versão/fingerprint, invalidação de texto semântico, não reutilização entre escopos, limite/expiração e equivalência de busca. Medições de ganho devem ser feitas separadamente com o runner de baseline E11; **não há ganho de latência presumido**. O cache não cobre as galerias ReUI, Pi, respostas de modelos ou dados remotos.
