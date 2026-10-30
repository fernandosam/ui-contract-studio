[English](typed-contract-sdk.md) | [Português](typed-contract-sdk.pt-BR.md)

# E12 — SDK tipado de contratos (TypeScript local)

A superfície pública de integração é uma **fachada local no mesmo processo** sobre o lock revisado, a projeção Pi, os schemas Zod reais e as regras estruturais. Não é API HTTP, pacote npm publicado, cliente de modelo de IA, mecanismo de admissão nem camada de autorização de backend.

Para uso completo, pins de revisões revisadas e tratamento padronizado de erros no consumidor, consulte o [guia de integração E12](integration-guide.pt-BR.md) e seu [exemplo com testes](../examples/integrations/contract-sdk.ts).

## Operações públicas

- `createContractSdk()` usa `stable` por padrão; `createContractSdk({ channel: "experimental" })` habilita explicitamente o catálogo experimental.
- `list()` mostra metadados públicos versionados, eventos e slots dos contratos disponíveis.
- `inspect(type)` informa metadados e a projeção JSON Schema dos props Zod, ou `null` para contratos indisponíveis ou inconsistentes.
- `validate(spec)` verifica JSON seguro, Zod real, grafo/ações e identidade entre lock e manifesto Pi. Em sucesso retorna `{ valid, spec, issues }`; em falha `{ valid, issues }`.
- `generate({ root, nodes, state? })` monta deterministicamente a especificação JSON, preenche `children: []` e valida antes de retornar. Não chama modelo de IA.

## Exemplo

```ts
import { createContractSdk } from "../src/sdk";
const sdk = createContractSdk();
const result = sdk.generate({
  root: "intro",
  nodes: [{ id: "intro", type: "Card", props: { title: "Olá", description: null } }],
});
if (!result.valid) throw new Error(result.issues.map(issue => issue.code).join(", "));
const contract = sdk.inspect("Card");
console.log(contract?.version, contract?.fingerprint);
```

## Segurança e versionamento

Gerar significa **criar especificações de tela com contratos existentes**, não criar nem admitir contratos novos. A tipagem dos props revisados é inferida das definições atuais; tipos experimentais recebem validação em runtime. A biblioteca não amplia Zod, grava arquivos de tela, executa ações locais, habilita dados remotos, acessa informações privadas, publica artefatos ou altera permissões Pi. Não usa rede externa.

Divergência de fingerprint ou versão entre lock e projeção Pi, entradas inválidas, tipos desconhecidos e eventos/ações não declarados são bloqueados. Entrada e saída são JSON plano com limites; os diagnósticos trazem código e caminho sem ecoar valores de props. Validação não substitui autorização de servidor nem E2E independente.

O import por código-fonte é para uso dentro deste repositório; não existe pacote público npm nem endpoint HTTP. Compatibilidade segue o SemVer e fingerprint por contrato.

## Verificação

```sh
npx tsx --test tests/contract-sdk.integration.test.ts
npm run semantic:check
npm run semantic:report
npm run validate
npm run build
```

E2E no navegador e integração real em outro aplicativo permanecem etapas separadas.
