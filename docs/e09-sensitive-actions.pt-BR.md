[English](e09-sensitive-actions.md) | [Português](e09-sensitive-actions.pt-BR.md)

# E09 — Autorização explícita, validação de parâmetros e confirmação de ações sensíveis

## Fronteiras de confiança

A especificação JSON gerada pelo Pi utiliza somente ações registradas no catálogo. Antes da renderização, o runtime valida a especificação com os schemas Zod reais e as invariantes do grafo. Os handlers locais `buttonClick`, `formSubmit` e `linkClick` agora validam os parâmetros novamente no instante da execução. As ações de estado continuam **exclusivamente locais**; caminhos inseguros (`__proto__`, `constructor`, `prototype`) são recusados pelo validador estrutural.

**Nenhuma ação Pi pode acionar um adaptador remoto, emitir um comprovante de confirmação ou conceder permissões no servidor.** Um diálogo de confirmação exibido por um componente gerado não constitui autorização.

O adaptador `/__demo__/submit`, restrito ao hospedeiro de testes, representa a fronteira de **gravação sensível**. O hospedeiro confiável deve fornecer:

1. Sessão autenticada resolvida no servidor, contendo usuário, tenant e serviço permitido.
2. Parâmetros válidos: JSON estrito, serviço aprovado, limites de campos e chave de idempotência.
3. Origin, token CSRF e cabeçalho `x-action-confirmation` válidos.
4. Comprovante de confirmação verificado, de uso único, associado a **usuário + tenant + serviço + chave de idempotência + campos exatos da requisição**.

O construtor HTTP exige `verifyConfirmation(ticket, payload, session)`. Verificação ausente, falsa ou com exceção bloqueia a ação (403), antes do adaptador de gravação e da consulta ao cache de idempotência. Booleanos enviados pelo cliente não constituem confirmação. O gateway de backend também exige `confirmationVerified: true` em contexto confiável; o adaptador HTTP só o define depois da validação no servidor.

## Integração pelo hospedeiro (não pelo Pi)

`createSubmissionConfirmations()` oferece um armazenamento **demonstrativo**, em memória, limitado e com validade de 90 segundos. O hospedeiro confiável só chama `issueAfterApproval(payload, identity)` **depois da aprovação explícita da operação exata pelo usuário**, na interface controlada pelo próprio hospedeiro. A especificação gerada, a prévia local e endpoints públicos nunca devem receber a capacidade de emitir comprovantes. Exemplo:

```ts
const confirmations = createSubmissionConfirmations();
const handler = createControlledDemoHttpHandler({
  allowedOrigin: "http://127.0.0.1:5173",
  services: [approvedDemoService],
  resolveSession: trustedSessionResolver,
  verifyConfirmation: async (ticket, payload, session) =>
    confirmations.consume(ticket, payload, session),
});
```

Depois da aprovação no hospedeiro, emita o comprovante para o payload e a identidade autenticada e envie-o em `x-action-confirmation`. Cada tentativa HTTP requer um novo comprovante; reutilização, expiração, parâmetros alterados e identidades divergentes são recusados. O adaptador permanece restrito a loopback e **não é uma API de produção**.

O hospedeiro **não pode** criar um endpoint público de emissão que dispense confirmação humana autenticada e iniciada pelo usuário. O armazenamento por processo não serve para produção com várias instâncias: seria necessário armazenamento durável, atômico, expirável e associado à identidade e à requisição. O backend confiável ainda deve validar autorizações e regras de negócio no momento da execução. Nunca inserir credenciais, tokens ou segredos no JSON gerado ou nos resumos de confirmação.

## Verificações de regressão

- `npx tsx --test tests/action-execution-boundary.integration.test.ts tests/submission-confirmation.integration.test.ts tests/submission-backend.integration.test.ts tests/submission-http.integration.test.ts`
- `npx playwright test tests/e2e/submission-controlled-http.spec.ts --project=desktop --project=mobile`
- `npm run test:offline && npm run pi:zod-schema && npm run validate && npm run build`

Alterações das fronteiras de segurança exigem revisão normal do PR; a elegibilidade ao auto-merge nativo exclui os módulos de submissão e as invariantes da spec. As verificações de admissão e semântica permanecem preservadas.

## Regressões adversariais E09

Os testes determinísticos em tests/e09-adversarial.test.mjs (sem dependências) e
tests/e09-adversarial.integration.test.ts (catálogo Zod real, host HTTP Node,
comprovação de confirmação e adaptador demonstrativo) cobrem três classes:

- Prompt injection / instruções falsificadas: mensagens de sistema e ferramenta
  forjadas em requisitos e rótulos, incluindo JSON que tenta ampliar ações.
  Tipos selecionados, regras fixas e ações Zod executáveis devem permanecer
  inalterados. Texto não confiável continua sendo dado, não autorização.
- Escalonamento de permissões: role, tenant, identidade, CSRF, concessões e
  comprovantes falsificados, replay, usuário diferente e adulteração de payload
  devem falhar de forma segura, sem gravações indevidas.
- Entradas malformadas: JSON inválido/grande, campos imprevistos, ações,
  eventos e parâmetros proibidos, grafos cíclicos/profundos, caminhos e campos
  de protótipo devem ser rejeitados sem revelar valores nos erros HTTP.

Os testes identificaram uma lacuna corrigida: caminhos de protótipo com
colchetes e aspas (ex.: profile["__proto__"]) agora são rejeitados.
Os nomes __proto__, prototype e constructor são proibidos tanto na emissão
de confirmação quanto na validação pelo backend.

Os jobs existentes em quality.yml incluem automaticamente as duas suítes:
- npm run test:offline
- npm run pi:zod-schema && npx tsx --test tests/e09-adversarial.integration.test.ts
- npm run validate && npm run build

São testes determinísticos das fronteiras, não uma avaliação de jailbreak de
LLM real, prova de sandbox do shell Pi ou garantia de autenticação/autorização
em produção. HTTP permanece demonstrativo e exclusivo de loopback. Revisar
os resultados de CI antes do merge das alterações sensíveis.
