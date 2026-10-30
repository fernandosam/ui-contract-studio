[English](pi-execution-log-policy.md) | [Português](pi-execution-log-policy.pt-BR.md)

# E10 — Privacidade, retenção e cardinalidade dos logs locais

O registrador JSONL E10 é **opcional**, local e de esquema fechado. Nada altera contratos Zod de UI, permissões Pi, Admission Engine, provedores externos ou retenção de logs do GitHub Actions. Os controles se aplicam a reports/pi-execution/; não apagam logs antigos do CI, de provedores, backups nem relatórios exportados separadamente.

## Proteção de dados sensíveis

O registrador admite apenas enums fixos e validados de origem/fase/status/motivo, contadores limitados, flags booleanas e UUIDs aleatórios de correlação. Ele **rejeita** chaves desconhecidas, texto livre, requisitos, prompts, JSON de tela, texto/pilhas de exceção, caminhos, credenciais e identificadores de usuários *antes da persistência*. Diagnósticos arbitrários não devem entrar em details. A função \`redactSensitiveText\` mascara e-mails, CPF, tokens de autorização, campos de senha/segredo e parâmetros de token em URL para *outros* diagnósticos; não amplia a lista permitida de eventos. Expressões regulares são uma proteção adicional, não garantia de anonimização de dados pessoais arbitrários.

UUIDs de execução, operação e evento permanecem nos logs brutos para correlação local; não devem servir como rótulos de métricas nem aparecem nos agregados HTML/CSV. Quem acessa os logs brutos pode correlacionar operações; restringir acesso ao diretório e excluir cópias exportadas separadamente.

## Política de armazenamento aplicada

| Limite | Padrão |
| --- | --- |
| Expiração de eventos | 7 dias após o timestamp UTC de cada evento |
| Arquivos JSONL no diretório E10 | 16 |
| Tamanho por arquivo | 4 MiB |
| Eventos por arquivo | 8.192 |
| Execuções distintas por arquivo | 512 |
| Operações distintas por arquivo | 4.096 |
| Eventos por registrador/processo | 1.024 |

A cada escrita opcional, o registrador adquire lock exclusivo do diretório, exclui arquivos JSONL vencidos, compacta linhas expiradas no arquivo ativo e elimina o arquivo E10 elegível mais antigo caso exceda a quantidade de arquivos ou o limite agregado de bytes. Não remove arquivos alheios ao padrão JSONL E10. A compactação substitui o arquivo atomicamente; gravações normais usam descritor que não segue symlinks. Caminhos/symlinks inseguros, registros antigos malformados, lock indisponível, estouro de quotas e timestamps indevidos **falham de forma segura**. O armazenamento é limitado, mas não constitui trilha de auditoria sem perdas: descarte e operações incompletas podem reduzir a cobertura.

A leitura dos relatórios não modifica arquivos e ignora eventos com mais de 7 dias mesmo sem manutenção. Períodos ausentes são desconhecidos, não períodos com zero falhas. Os limites controlam uso de memória e cardinalidade; nenhum usuário, prompt, URL, arquivo ou texto livre vira dimensão de métrica.

## Manutenção sem novas gravações

~~~bash
npm run pi:logs:prune
npm run pi:logs:prune -- --apply
node --test tests/execution-log-policy.test.mjs
~~~

O primeiro comando apenas apresenta contagens; \`--apply\` compacta/exclui eventos vencidos e aplica o limite de arquivos. A saída contém somente números, sem caminhos, UUIDs ou conteúdo. Para prazo estrito de exclusão, agendar o comando no sistema operacional; não foi criado daemon nem workflow automático. Um lock \`.e10-writer.lock\` remanescente após falha bloqueia novas gravações/manutenção e só deve ser removido **quando não houver outro escritor ativo**. Não se garante eliminação física de snapshots e backups.

Antes de atingir uma quota, rotacionar ou escolher outro nome de arquivo válido; não há descarte silencioso. Verificar permissões locais, backups e retenção independente do provedor antes de usar com dados reais. Consultar [eventos E10](pi-execution-events.pt-BR.md), [métricas](pi-execution-metrics.pt-BR.md) e [tendências](pi-execution-trends.pt-BR.md).
