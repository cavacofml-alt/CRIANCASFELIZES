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
- ⏳ Etapa 3 — comunicação escola-família. Ainda não iniciada. Ver
  "Pendente de decisão" abaixo antes de começar.

## Referência de produto: Famly

O utilizador apontou o **Famly** (famly.co) como referência de qualidade
de UX para este mercado (creches/gestão escola-família) — no mesmo
segmento do EducaBiz, mas produto mais maduro.

Combinado: antes de definir o que entra na Etapa 3 (e potencialmente
etapas seguintes), comparar funcionalidades entre EducaBiz, Famly e o
que o mercado português precisa especificamente (ex.: faturação com
NIF, regras da Segurança Social para creches, tudo em português),
e o utilizador escolhe o que entra na v1. Isto ainda não foi feito.

## Pendente de decisão — antes de começar a Etapa 3

Perguntas feitas ao utilizador, ainda sem resposta:

1. **Avisos gerais** (mural — a escola publica, todos os encarregados
   veem) — entra na v1? (assumido que sim, mas não confirmado)
2. **Mensagens diretas** entre educador e encarregado — entram já na
   v1 ou ficam para depois?
3. Fazer a comparação com o Famly (e talvez outros produtos do género)
   antes de fechar o âmbito da Etapa 3?

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
