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
- ⚠️ Etapa 3 — comunicação escola-família. **Implementada em código**
  (mural de avisos, mensagens diretas 1:1, notificações in-app — ver
  branch `claude/projeto-etapa-3-y7yviq`), mas foi construída por uma
  sessão que não tinha visto as perguntas pendentes abaixo nem tinha
  feito a comparação com o Famly combinada. A comparação foi feita
  depois, a posteriori (ver secção seguinte); a decisão de manter,
  ajustar ou revisitar esta etapa está por confirmar com o utilizador.

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

Recomendação registada (ainda não confirmada pelo utilizador): manter
mural simples + mensagens 1:1 para a v1; considerar o padrão "social"
do Famly (comentários/reações, mensagens de grupo) como refinamento na
Etapa 6 (UI/UX final), não como base agora.

## Pendente de decisão

Perguntas feitas ao utilizador, respondidas ou por confirmar:

1. Mural de avisos entra na v1? → Implementado; por confirmar se fica.
2. Mensagens diretas entram já na v1? → Implementado; por confirmar se
   fica.
3. Mural deve ganhar comentários/reações (estilo Famly) ou ficar
   simples (estilo EducaBiz)? → Pergunta feita ao utilizador, ainda sem
   resposta.
4. Mensagens devem suportar grupo (educador → todos os encarregados de
   uma turma) ou ficar só 1:1? → Pergunta feita ao utilizador, ainda
   sem resposta.

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
