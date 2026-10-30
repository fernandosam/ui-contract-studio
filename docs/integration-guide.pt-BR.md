[English](integration-guide.md) | [Português](integration-guide.pt-BR.md)

# E12 — Guia de integração do UI Contract Studio

Este é o guia **para consumidores** do SDK local e da CLI existentes. Descreve o comportamento real; o envelope de erros a seguir é um **adaptador de exemplo**, não uma nova API de servidor. Consulte [SDK tipado](typed-contract-sdk.pt-BR.md), [decisão arquivos/CLI](external-integrations.pt-BR.md), [versionamento](contract-versioning.pt-BR.md) e [segurança](../SECURITY.pt-BR.md).

## Escolher a menor integração disponível

| Consumidor | Entrada existente | Limite |
| --- | --- | --- |
| Ferramentas/CI em revisão fixada do repositório | `pi-catalog/contracts.json` + `pi-catalog/examples/` + `npm run pi:validate` | Arquivos de leitura e processo local; sem serviço remoto |
| Código TypeScript confiável usando o código deste repositório | `createContractSdk` de `src/sdk/index.ts` | Geração, listagem, inspeção e validação no mesmo processo; não há pacote npm publicado |
| Chamadores não confiáveis de um servidor | Fronteira de autenticação e autorização fornecida pelo **host** | Gateway Node opcional proposto no [PR #197](https://github.com/fernandosam/ui-contract-studio/pull/197), **ainda ausente da main nesta revisão** |
| Renderização no navegador | Runtime controlado pela aplicação | O SDK não é um renderizador autônomo nem autoriza operações de rede |

O padrão é **stable**. O experimental exige opt-in para desenvolvimento interno revisado e não concede direito automático de produção. Não há endpoint HTTP E12, pacote SDK externo, webhook, ferramenta MCP ou execução remota do Pi.

## 1. Exemplo com SDK local

Em um checkout de **commit Git revisado** (Node.js 22+, `npm ci`), execute o teste do exemplo:

~~~sh
npx tsx --test tests/integration-guide.integration.test.ts
~~~

O [exemplo TypeScript executável](../examples/integrations/contract-sdk.ts) exporta `generatePinnedCard(pin)` e `normalizeValidation(result)`. Exige `type`, `version` e `fingerprint` **registrados previamente** e rejeita a geração se houver diferença em relação a `sdk.inspect("Card")`.

Uso mínimo dentro do repositório:

~~~ts
import { createContractSdk } from "../src/sdk";

const sdk = createContractSdk(); // stable, local, sem rede
const details = sdk.inspect("Card"); // null quando indisponível/inconsistente
if (!details) throw new Error("Contrato indisponível");
const result = sdk.generate({
  root: "intro",
  nodes: [{ id: "intro", type: "Card", props: { title: "Boas-vindas", description: null } }],
});
if (!result.valid) {
  // Devolver códigos/caminhos limitados ao solicitante; não registrar valores em logs.
  throw new Error("Spec rejeitada: " + result.issues.map(issue => issue.code).join(", "));
}
// result.spec é um JSON independente e validado com Zod e invariantes do grafo.
~~~

`list()` descobre contratos disponíveis; `inspect(type)` fornece versão, fingerprint, maturidade, eventos/slots e projeção JSON Schema dos props. `validate(unknown)` valida uma spec existente. `generate({ root, nodes, state? })` monta e valida a spec; **não utiliza IA** nem admite tipos novos. Veja os tipos de retorno em [SDK tipado](typed-contract-sdk.pt-BR.md). Nunca ofereça o SDK desprotegido a clientes externos não confiáveis.

## 2. Integração por arquivos/CLI

Fixe o repositório em um **SHA imutável e revisado**; no checkout:

~~~sh
npm ci
npm run pi:api:check
npm run pi:validate -- --file=pi-catalog/examples/Card.json
~~~

O validador lê arquivo JSON **local**; não busca arquivos nem publica HTTP. Entradas de produção devem ter caminho controlado dentro do checkout (sem travessia). A saída opcional é restrita a `reports/pi-validation/*.json` por `--out=reports/pi-validation/result.json`.

Para validações normais a CLI emite JSON com `valid`, `source`, `channel`, `validator`, `issues` limitadas e `truncated`. Código de saída `0` significa válido, `1` rejeitado e `2` indica argumento inválido. Impossibilidade de iniciar o processo, falta de saída ou JSON malformado **também bloqueiam** a entrega. Erros de argumentos ou arquivos não garantem o envelope JSON normal. Confira **tanto** o código de saída **quanto** `valid === true`; não use texto de stdout isoladamente para autorizar.

O manifesto usa `schemaVersion: 3` e um array `components` que também pode conter contratos experimentais. Ler manifesto/exemplo não concede ações, props, rede ou privilégios. Verifique o lock revisado e aplique o validador Zod real.

## 3. Versionamento e adoção de mudanças

Preserve **três identidades diferentes**:

| Identidade | Significado | Regra do consumidor |
| --- | --- | --- |
| SHA de commit Git | Revisão exata de código/validador/manifesto | Fixar SHA imutável por release; usar revisões compatíveis de validador e renderizador |
| `schemaVersion` / `projectVersion` | Formato do manifesto / versão do projeto | Exigir formato suportado (atualmente `3`); versão do projeto **não** é SemVer do contrato |
| `type` + `version` + `fingerprint` por contrato | Identidade de componente revisado | Registrar a tripla na versão consumidora e compará-la via `inspect` ou manifesto revisado |

As versões por contrato seguem o [SemVer E07](contract-versioning.pt-BR.md): adições compatíveis e mudanças incompatíveis exigem revisão. Um fingerprint alterado **não** autoriza migração automática, e fingerprint igual não comprova compatibilidade E2E. Ao atualizar: compare tipos usados, consulte o [relatório de impacto](contract-versioning.pt-BR.md), execute novamente `pi:api:check`, `pi:validate`/SDK, testes afetados e verificações visuais; publique somente após revisão. Metadados ausentes ou versões desconhecidas **falham de modo fechado**. Migrações históricas expressas, quando aprovadas, usam [`contracts:migrate`](contract-versioning.pt-BR.md), não suposições no runtime.

## 4. Tratamento padronizado de erros na fronteira consumidora

O **contrato original do SDK permanece igual**: `validate`/`generate` retornam união discriminada por `valid`; `inspect` retorna `null` quando o tipo não está disponível. `issues[].code` pode vir do Zod, das invariantes ou do SDK; **não presuma uma enumeração pública fixa**. O [adaptador de exemplo](../examples/integrations/contract-sdk.ts) converte esses resultados em um envelope opcional e sanitizado:

~~~json
{
  "ok": false,
  "error": {
    "code": "SPEC_INVALID",
    "message": "Specification rejected by the reviewed contract validator.",
    "retryable": false,
    "issues": [{ "code": "unrecognized_keys", "pointer": "/elements/intro/props" }]
  }
}
~~~

As categorias **do exemplo de integração** são `CONTRACT_UNAVAILABLE`, `CONTRACT_VERSION_MISMATCH` e `SPEC_INVALID`. **Não** são códigos nativos do SDK. Em sucesso, o exemplo retorna `{ ok: true, spec, contract }`. Há limite de 20 códigos/caminhos, sem valores rejeitados nem mensagens Zod. Um JSON pointer pode conter identificador criado pelo usuário: forneça apenas ao solicitante autorizado e **não o registre integralmente**.

| Origem | Detecção | Ação / nova tentativa |
| --- | --- | --- |
| JSON, tipo/prop/ação, grafo ou ID inválido no SDK | `valid: false`, `issues` limitadas (`invalid_json_input`, `graph_invariant`, `contract_not_authorized` etc.) | `SPEC_INVALID`; corrigir entrada; **sem retry automático** |
| Contrato não disponível, versão/fingerprint alterados | `inspect(...) === null` ou divergência no pin | `CONTRACT_UNAVAILABLE` / `CONTRACT_VERSION_MISMATCH`; revisar; nunca fazer downgrade ou fallback experimental |
| Inicialização inválida do SDK, manifesto inconsistente ou exceção inesperada | Exceção ou falha do processo | Falha fechada, alerta operacional; nunca devolver stack trace nem valores brutos |
| Rejeição na CLI, saída ausente/inutilizável | Código não zero, `valid !== true` ou JSON inválido | Bloquear build/release; analisar diagnóstico sanitizado sem retry cego |
| Autenticação/autorização, tamanho, quota (**host / PR #197 pendente**) | Gateway `{ ok: false, status, error, retryAfterSeconds? }` | Mapeamento abaixo; não existe rota HTTP implantada |

**Vocabulário do gateway apenas no PR #197:** `401 unauthorized` (verificar credencial sem loops de retry), `403 forbidden` (exigir escopo), `400 invalid_request` e `413 payload_too_large` (corrigir entrada), `429 rate_limited`/`quota_exceeded`/`busy` (nova tentativa limitada e com jitter, **somente** após `retryAfterSeconds` quando informado e em operações idempotentes) e `503 unavailable` (falhar fechado e investigar; retry não é garantidamente seguro). Um retorno `{ ok: true, status: 200, value: { valid: false, issues } }` significa **spec rejeitada pelo validador**, não falha de autenticação. Esses status pertencem ao gateway Node; qualquer mapeamento HTTP é responsabilidade do **host**.

## 5. Segurança e verificações

Autenticação externa é sempre do host: conferir assinatura/introspecção, emissor, audiência, expiração e revogação, derivar peer/tenant/identidade de fontes confiáveis, impor escopos, TLS/CSRF e quotas distribuídas em múltiplas réplicas. Os contadores do gateway pendente são **somente por processo**. Não registrar tokens, dados pessoais, specs, valores rejeitados, ponteiros ou segredos. Permissões Pi e admissão continuam independentes de documentação e SDK.

Após alterações, executar:

~~~sh
npm run docs:check
npx tsx --test tests/integration-guide.integration.test.ts
npm run semantic:check
npm run semantic:report
npm run validate
npm run build
~~~

Os comandos exigem dependências instaladas e apenas resultados efetivamente executados são evidência. O E2E completo no navegador continua sendo etapa **manual na main**; este guia e seus exemplos não a substituem.
