[English](sdk-access-control.md) | [Português](sdk-access-control.pt-BR.md)

# E12 — Controle de acesso ao SDK local de contratos

Esta é uma camada **opcional e exclusiva do servidor** para proteger o [SDK tipado](typed-contract-sdk.pt-BR.md) executado no mesmo processo. Não abre portas, não oferece rota HTTP, não autentica usuários por conta própria, não emite JWT/chaves de API, não amplia permissões Pi, contratos Zod ou admissão/publicação. O SDK direto continua disponível a código local confiável: a proteção somente vale quando o host encaminha **todas as chamadas externas** por esta camada.

## Contrato de integração

Um servidor ou worker confiável deve:

1. Tratar o transporte autenticado e obter `peerId` de metadados de rede confiáveis (por exemplo, proxy que valida e sobrescreve headers encaminhados), nunca de um campo controlado pelo cliente.
2. Fornecer `authenticate(bearerToken)` com verificação real de assinatura/introspecção do token, emissor, destinatário, validade, revogação e escopos/tenant, conforme o provedor. Retornar `null` se não verificado. **Decodificar um JWT sem conferir assinatura não autentica ninguém.**
3. Instanciar `createContractSdk()` no servidor. O SDK experimental é opcional, exigindo seleção explícita do canal **e** escopo independente `contracts:experimental`.
4. Invocar `execute(trustedTransport, command)` em todas as operações externas. O comando não aceita identidade nem tenant; o gateway confere permissões, tamanho e capacidade antes de chamar o SDK.
5. Converter `status` e `error` em respostas seguras. Não encaminhar credenciais, exceções internas, JSON rejeitado ou identificadores pessoais para logs.

```ts
import { createContractSdk } from "../src/sdk";
import { createProtectedContractGateway } from "../src/sdk/server.mjs";

// identityProvider e transport pertencem ao host confiável.
// identityProvider.verify PRECISA validar assinatura/introspecção de verdade.
const gateway = createProtectedContractGateway({
  stableSdk: createContractSdk(),
  authenticate: token => identityProvider.verify(token),
});

const result = await gateway.execute(
  { peerId: transport.verifiedPeerId, bearerToken: transport.bearerToken },
  { operation: "validate", input: submittedSpec },
);
if (!result.ok) {
  // Enviar somente result.status/error; respeitar retryAfterSeconds.
}
```

O exemplo não constitui um servidor pronto: `identityProvider`, `transport` e `submittedSpec` devem ser fornecidos pelo host. Os escopos aceitos são `contracts:read` (listagem/inspeção), `contracts:validate`, `contracts:generate` e `contracts:experimental` (condição adicional, nunca substituta do escopo da operação). Não há wildcard nem privilégios administrativos implícitos.

## Valores padrão e falhas

| Controle | Padrão por instância |
| --- | ---: |
| Tentativas pré-autenticação por peer confiável | 60/minuto |
| Tentativas pré-autenticação globais | 5.000/minuto |
| Autenticações simultâneas | 32 |
| Operações por tenant + usuário | 120/minuto e 2.000/dia UTC |
| Operações simultâneas do SDK | 4 por tenant + usuário, 32 globais |
| Tamanho serializado do comando | 256.000 bytes |
| Nós do comando / profundidade máxima | 6.000 / 40 |
| Peers / identidades rastreadas | 2.000 / 10.000 |

Os limites são validados e podem ser reduzidos pelo host. A contabilização usa janelas fixas e memória limitada **por processo**. Chamadas acima das quotas são rejeitadas antes de executar o SDK; vagas de concorrência são liberadas em sucesso e erro. Janelas fixas permitem rajadas nas suas transições: não representam controle de janela deslizante ou de faturamento. Tokens e IDs não ficam em texto puro nas chaves do limitador (HMAC com segredo por instância); o token bruto chega somente ao autenticador do host.

Respostas sanitizadas: `401 unauthorized`, `403 forbidden`, `400 invalid_request`, `413 payload_too_large`, `429 rate_limited|quota_exceeded|busy` e `503 unavailable`. Algumas respostas 429 incluem `retryAfterSeconds`. Um spec inválido retornado pelo validador continua sendo resultado normal da operação, e não falha de transporte.

## Limitações para produção

- **Uma instância por vez.** Réplicas, reinícios e retries criam contadores independentes. Em clusters, adotar quotas **atômicas compartilhadas** (por exemplo, no gateway ou Redis) e testar concorrência entre instâncias; este módulo não promete quotas distribuídas.
- **Nenhum endpoint publicado.** TLS/HTTPS, CORS, CSRF (com cookies), WAF/DDoS, allowlists de rede, limites de leitura de body, proxy confiável, rotação e revogação de credenciais pertencem ao host. O autenticador precisa impor timeouts/cancelamento; o gateway limita autenticações em andamento, mas não interrompe um provedor travado. O SDK síncrono não é sandbox de CPU; usar isolamento e budgets de recursos no processo/worker.
- **Quotas de requisições, não tokens.** A camada conta operações do SDK, não tokens de LLM, dinheiro ou efeitos externos. Uma geração remunerada futura exigirá medição, orçamento e idempotência próprios no serviço real.
- **Permissões fechadas.** Nunca derivar escopos de JSON gerado pelo Pi, exemplos, catálogo semântico, tenant informado pelo cliente ou certificados experimentais. Lock, Zod e política de admissão continuam sendo as autoridades.
- **Observabilidade mínima.** Registrar no E10 somente status, operação e métricas agregadas sanitizadas; nunca tokens, IDs brutos de peer, tenant/usuário ou payloads rejeitados.

## Verificação

```sh
node --test tests/sdk-access-control.test.mjs
npm run semantic:check
npm run semantic:report
npm run test:offline
npm run validate
npm run build
```

O E2E completo permanece manual na main. Estes testes cobrem a camada em um processo usando identidades e SDKs artificiais; não comprovam segurança de um provedor OIDC real, proxy, armazenamento distribuído ou futura API HTTP.
