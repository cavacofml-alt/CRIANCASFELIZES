# Notas do projeto (decisões e pendências fora do CLAUDE.md)

Este ficheiro existe para nada se perder entre sessões de trabalho. O
`CLAUDE.md` tem as regras fixas do projeto; este ficheiro tem o estado
"vivo" — decisões tomadas em conversa, pendências, ideias por explorar.
Atualizar sempre que surgir algo relevante que não pertença ao CLAUDE.md.

## Estado atual (última atualização: fim da Etapa 2)

- ✅ Etapa 0 — contas externas criadas (GitHub, Supabase, Vercel ligados).
- ✅ Etapa 1 — Next.js + Tailwind + Supabase, deploy em
  https://criancasfelizes.vercel.app
- ✅ Etapa 2 — schema, RLS (25/25 testes adversariais a passar),
  autenticação com 3 papéis. Verificado manualmente pelo utilizador com
  3 contas fictícias diferentes.
- ✅ Etapa 3 — comunicação escola-família. Mural de avisos (simples,
  sem comentários/reações), mensagens diretas 1:1 e notificações
  in-app — branch `claude/projeto-etapa-3-y7yviq`. Âmbito confirmado
  pelo utilizador depois da comparação com o Famly (ver secção
  seguinte): mural fica simples, mensagens ficam 1:1. Verificado
  pessoalmente pelo utilizador em produção (preview da Vercel) com as
  4 contas fictícias da Creche Arco-Íris; encontrado e corrigido em
  conjunto um bug real (contador de notificações não lidas nunca
  descia — faltava marcar a notificação como lida, só a mensagem;
  corrigido no branch, verificado que o contador já zera). Etapa
  considerada fechada; a aguardar autorização para avançar para a
  Etapa 4.

## Referência de produto: Famly — comparação feita

O utilizador apontou o **Famly** (famly.co) como referência de qualidade
de UX para este mercado (creches/gestão escola-família) — no mesmo
segmento do EducaBiz, mas produto mais maduro. Comparação feita
(pesquisa web, sem acesso direto à app):

| | EducaBiz | Famly | Implementado na Etapa 3 |
|---|---|---|---|
| Mural/avisos | Feed de comunicação | **Newsfeed** social: educadores publicam com fotos/vídeo, pais podem comentar e reagir | Mural simples, só leitura, sem comentários/reações |
| Mensagens diretas | 1:1, por criança, com anexos, fica no processo do aluno | 1:1 **ou em grupo**, distintas do newsfeed | 1:1, sem anexos, sem grupo |
| Notificações in-app | Sim | Sim | Sim (geradas por trigger na BD) |
| Relatórios diários / presenças / faturas | Sim | Sim | Fora do âmbito — Etapas 4, 5 e 9 |

Diferença mais relevante: o Famly separa newsfeed "social" (com
comentários/reações) de mensagens privadas; o que foi implementado é
mais parecido com o EducaBiz — mural só de anúncios oficiais, sem
interação pública entre pais. Mais simples de moderar e mais
defensável com dados de menores; menos "vivo" que o Famly.

**Decisão do utilizador (confirmada): mural fica simples, mensagens
ficam 1:1.** O padrão "social" do Famly (comentários/reações, mensagens
de grupo) fica de fora da v1; pode ser reconsiderado na Etapa 6
(UI/UX final) se fizer sentido nessa altura, mas não é um compromisso.

## Pendente de decisão

Nada pendente da Etapa 3 neste momento.

## Dívida técnica / lembretes de segurança (ver também CLAUDE.md)

- 🔑 **Rodar a chave `service_role` do Supabase.** Foi colada nesta
  conversa em texto, o que significa que passou pela infraestrutura da
  Anthropic. Sem urgência enquanto só há dados fictícios, mas
  **obrigatório antes da Etapa 8** (dados reais). Local: Supabase →
  Project Settings → API → gerar nova chave secret/service_role, depois
  atualizar a variável no Vercel.
- 🌐 **Rede da sessão** — o ambiente cloud tinha `Network access:
  Trusted`, o que bloqueava chamadas diretas ao Supabase
  (`qkftgmlvpjbbyamsznaz.supabase.co`). O utilizador mudou para
  `Custom` com `*.supabase.co` permitido (mantendo os domínios
  Trusted por omissão). A partir de sessões novas isto deve permitir
  correr scripts de seed/teste diretamente, sem depender de o
  utilizador colar SQL manualmente no dashboard do Supabase.
- 📋 As migrações SQL (`supabase/migrations/*.sql`) foram todas
  corridas manualmente no SQL Editor do Supabase, não através da CLI
  Supabase nem de um sistema de migrações automatizado. Isto é
  aceitável por agora mas deve ser revisto na Etapa 7 (auditoria).
- 🖼️ Ainda não existem regras de segurança para o Storage
  (upload de fotos) — só entram na Etapa 5.

## Contas fictícias de teste (criadas em 0003_dados_ficticios.sql)

Palavra-passe de todas: `Teste1234!`

| Email | Papel | Escola |
|---|---|---|
| rita.admin@example.com | admin | Creche Arco-Íris |
| ana.silva@example.com | staff (turma Borboletas) | Creche Arco-Íris |
| bruno.costa@example.com | staff (turma Girassóis) | Creche Arco-Íris |
| carla.ferreira@example.com | encarregada (mãe da Matilde) | Creche Arco-Íris |
| diogo.pinto@example.com | encarregado (pai da Leonor) | Creche Arco-Íris |
| paulo.admin@example.com | admin | Creche Estrelinha (escola vizinha, para testar isolamento) |

## Modelo de IA usado por etapa (para referência futura)

- Etapa 1: Sonnet 5, esforço médio.
- Etapa 2: Opus 5, esforço alto (schema + RLS = código crítico).
- Etapa 3: Sonnet 5, esforço médio para CRUD; considerar subir esforço
  especificamente para as políticas RLS das tabelas novas
  (avisos/mensagens) antes de dar a etapa como concluída.
