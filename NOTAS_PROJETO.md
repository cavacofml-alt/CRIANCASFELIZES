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
  fechada, autorizada pelo utilizador a avançar para a Etapa 4.
- ✅ Etapa 4 — presenças (check-in/check-out, registo de quem levanta
  a criança). Tabela `presencas` (uma linha por criança por dia), RLS
  (staff só das suas turmas, admin de toda a escola, encarregado só
  consulta), UI de check-in/check-out com escolha de quem levantou a
  criança (encarregado registado ou nome livre, para quem não tem
  conta — ex. avó). Verificada pessoalmente pelo utilizador em
  produção; encontrado e corrigido em conjunto um bug real (horas
  erradas — faltava fixar `timeZone: "Europe/Lisbon"` nos componentes
  de servidor, que corriam em UTC na Vercel; corrigido de forma
  centralizada em `src/lib/data.ts`, aplicado também ao mural e às
  mensagens que tinham o mesmo problema). Etapa fechada.
- ⏳ Etapa 5 — relatórios diários e fotos por turma. Migrations 0014 a
  0017 aplicadas. **Parcialmente verificado**:
  - ✅ Relatório diário: Ana preencheu o da Matilde, Carla confirmou
    que só vê o relatório da Matilde (isolamento por criança a
    funcionar).
  - ✅ Upload de foto: Ana enviou uma foto a sério para a turma
    Borboletas — confirmado pela legenda "Borboletas · Ana Silva ·
    11/08/2026, 18:55:39" a aparecer.
  - ⚠️ **Por confirmar**: a página `/painel/fotos` mostrou, nas duas
    contas (Ana e Carla), a caixa da galeria com texto sobreposto e
    ilegível em vez de uma grelha de fotos normal. Suspeita forte de
    ser um artefacto de transição de página no browser (apareceu
    conteúdo idêntico — fragmentos de uma mensagem antiga — nas duas
    contas, o que não bate certo com ser um bug de RLS a mostrar dados
    a mais). Utilizador vai confirmar mais tarde com um refresh
    forçado (Ctrl/Cmd+Shift+R) e enviar print novo. **Não dar a Etapa
    5 como fechada até isto ficar claro.**
- ⏳ Etapa 6 — identidade visual e animações, aplicadas a todas as
  funcionalidades já construídas (branco/limpo + azul como cor de
  destaque, cor por turma mantida como detalhe — não depende do nome
  da turma, ver `src/lib/turmas.ts`). **Implementada em código**,
  ainda **por verificar pessoalmente pelo utilizador**. Não são
  precisas migrations desta vez — só código da aplicação, basta fazer
  redeploy do branch na Vercel. `framer-motion` instalada (já prevista
  no CLAUDE.md); animações discretas: entrada suave de página, listas
  em cascata, indicador ativo animado na navegação, expandir/colapsar
  formulários. Ao testar localmente, o `next dev` alterou
  automaticamente o `CLAUDE.md` (funcionalidade nova do Next.js,
  `agentRules`) — revertido e desativado em `next.config.ts` para não
  voltar a acontecer.
- ⚠️ **Lição aprendida na Etapa 6**: a primeira passagem só repintou
  cores em cada página, sem confirmar se o conteúdo batia certo com o
  que tínhamos combinado. Resultado: o utilizador viu o "Início" e
  reparou que não tinha nada a ver com a maqueta acordada. Auditoria
  feita depois, a pedido do utilizador, encontrou mais dois desvios já
  corrigidos: faltava a barra "Presentes/Por chegar/Total" nas
  Presenças, e os Relatórios ainda usavam menus pendentes em vez dos
  botões de um toque combinados. Regra para o futuro: ao terminar uma
  etapa de UI, comparar cada ecrã com o que foi especificamente
  combinado (não só com o tema geral) antes de pedir verificação.
- ⚠️ Ainda por fazer: **renomear o branch de trabalho** —
  `claude/projeto-etapa-3-y7yviq` já tem as Etapas 3, 4 e 5; o nome
  ficou desatualizado mas não é urgente corrigir.
- 📝 O utilizador considerou dar acesso direto (Vercel + Supabase) a
  esta sessão para aplicar migrations e fazer deploy sem o processo
  manual de copiar/colar — decidiu **não avançar por agora** por ser
  complexo de configurar. Mantemos o fluxo manual (colar SQL,
  utilizador corre no Supabase, redeploy na Vercel).

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

## Backlog de ideias futuras (fora das 10 etapas do CLAUDE.md)

Lista trazida pelo utilizador em 2026-08-11. Nenhum destes itens está a
ser construído agora — ficam aqui para não se perderem e serem
discutidos quando fizer sentido (provavelmente depois da v1 estar
validada na escola piloto, Etapa 8).

1. **Contas reais com autenticação segura** — isto já é, em grande
   parte, o que a Etapa 8 do CLAUDE.md cobre ("migração para dados
   reais"). A autenticação em si (Supabase Auth) já é seguro desde a
   Etapa 2; o que falta é ativar contas da escola a sério, o que só
   pode acontecer depois da Etapa 7 (auditoria RGPD) estar concluída e
   com consentimento assinado da escola. Não é um item novo — é um
   lembrete de que a Etapa 8 já cobre isto.
2. **Notificações push para o telemóvel** — item novo, fora do plano
   atual. Hoje só há notificações *in-app* (o número vermelho no
   menu), que só aparecem quando alguém abre a aplicação. Para
   notificar mesmo com a app fechada é preciso: ou uma app nativa, ou
   transformar isto numa PWA com Web Push + um serviço de envio (ex.
   Firebase Cloud Messaging, tem nível gratuito mas é infraestrutura
   nova). Por decidir o âmbito quando chegar a altura.
3. **Base de dados partilhada entre utilizadores diferentes** — a
   confirmar o que o utilizador quer dizer com isto, porque já existe
   uma base de dados só (Supabase Postgres), partilhada por todos os
   utilizadores da mesma escola, com o RLS a decidir o que cada um vê.
   Se quer dizer "várias escolas na mesma aplicação" isso já é a
   Etapa 10 (multi-tenant) do CLAUDE.md. Se quer dizer "ver
   atualizações ao vivo sem recarregar a página" (ex. uma mensagem
   nova aparecer sozinha), isso é um item novo — usar o Supabase
   Realtime — e ainda não está implementado (hoje é preciso navegar/
   atualizar para ver dados novos).
4. **Aplicação móvel** — promovido a etapa formal em 2026-08-12 (ver
   "Etapa 11" abaixo), a pedido do utilizador. Fica na fila, depois da
   Etapa 8 (dados reais do piloto).

## Etapa 11 (proposta, fora das 10 etapas originais do CLAUDE.md) — Aplicação móvel

Pedido pelo utilizador em 2026-08-12. Regista-se aqui, não no CLAUDE.md
(esse ficheiro é a especificação original, mantida à parte). Só avança
depois de a Etapa 8 estar concluída — combinado com o utilizador.

Duas opções muito diferentes em esforço e custo, a decidir quando
chegar a altura:

- **PWA (recomendado para começar)** — a app web atual, instalável no
  ecrã principal do telemóvel, ecrã inteiro, alguma funcionalidade
  offline. Sem custos, sem lojas de aplicações, reaproveita todo o
  código já feito.
- **App nativa (React Native/Expo)** — publicada na App Store e Google
  Play. Recriação dos ecrãs numa tecnologia diferente, mais trabalho.
  Custos reais que o utilizador tem de autorizar e pagar diretamente:
  conta Apple Developer (~99 USD/ano) e Google Play (~25 USD,
  pagamento único).

Notificações push (item 2 do backlog acima) ficam mais fáceis de
resolver bem numa app nativa do que numa PWA, sobretudo no iPhone —
outro fator a pesar na escolha, quando chegar a altura.

## Etapa 12 (implementada, fora das 10 etapas originais) — Reformulação UX

Pedido pelo utilizador em 2026-08-12, com uma proposta de design
própria (inspirada, segundo o utilizador, numa abordagem mais europeia/
portuguesa do que o modelo "tipo Brightwheel" convencional). Ao
contrário da Etapa 11, o utilizador pediu para avançar de imediato, não
só registar a ideia — por isso já está implementada e no branch.

O que mudou:

- **Navegação da família** (`src/app/painel/nav.tsx`) passou a
  depender do papel. Encarregados de educação veem 4 áreas: **Hoje**
  (/painel, já existia), **Momentos** (/painel/fotos, já existia),
  **Comunicação** (/painel/mensagens, já existia) e **Perfil** (nova).
  O Mural e o histórico de Relatórios continuam a existir e acessíveis
  por link, só deixaram de ter lugar fixo na barra de navegação da
  família — não foi apagada nenhuma funcionalidade.
- **Perfil da criança** (`/painel/perfil`, nova): mostra nome, data de
  nascimento, turma e outros encarregados de educação ligados — tudo
  dados que já existiam. **Não inclui ainda** alergias, autorizações de
  quem pode levantar a criança, nem documentos — isso precisa de schema
  novo (novas colunas/tabelas) e fica deliberadamente para uma fase
  seguinte, para não se mexer em dados de saúde/autorização à pressa.
- **Registo rápido do educador** (`/painel/registar`, nova, só staff/
  admin): lista da turma → tocar numa criança → grelha de 5 ações
  (Refeição, Sesta, Higiene, Fotografia, Observação) → cada uma
  guardada em um ou dois toques, sem formulário longo. Reaproveita as
  mesmas mutações já existentes de `relatorios_diarios` e `fotos` — não
  foi preciso nenhuma migration nova para isto.
- Ideia do "diário automático" (gerar texto a partir dos registos, com
  IA) foi explicitamente adiada pelo utilizador — tem custos (chamadas
  a uma API de IA) e implica mandar dados da criança para um serviço
  externo, por isso só deve ser decidida mais tarde, depois do básico
  do piloto estar validado.

Testado contra a base de dados a sério (não só visualmente), com a
conta de demonstração da educadora: registo de refeição, sesta e troca
de fralda confirmados a gravar corretamente. Não houve alterações a
RLS nem a schema — os 104 testes adversariais de segurança continuam
todos a passar.

**Por fazer, deliberadamente adiado** (ver tarefa registada): schema de
"Desenvolvimento" (marcos de evolução da criança) e o resto do Perfil
(alergias, autorizações, documentos) — precisam de migration nova e do
mesmo cuidado de RLS que todo o resto do projeto trata como código
crítico. Não avançar sem confirmar com o utilizador primeiro.

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

Recriar com `npm run seed` sempre que precisares (apaga e recria do zero,
nunca correr com dados reais).

## Escola fictícia de demonstração (para apresentar o produto)

Diferente das contas de teste acima — esta é pensada para mostrar a
aplicação a alguém (a escola-piloto, por exemplo), com conteúdo mais
rico e realista: avisos, conversas, presenças e relatórios já
preenchidos com o dia de hoje. Criada com `npm run seed:demo`
(`scripts/seed-demo.mjs`), independente das contas de teste — podes
correr uma sem afetar a outra.

Palavra-passe de todas: `Demo1234!`

| Email | Papel | Turma |
|---|---|---|
| demo.mariana@example.com | admin (diretora) | — |
| demo.ines@example.com | staff | Passarinhos |
| demo.tiago@example.com | staff | Estrelinhas |
| demo.sofia@example.com | encarregada (mãe da Beatriz) | Passarinhos |
| demo.pedro@example.com | encarregado (pai do Gonçalo) | Passarinhos |
| demo.catarina@example.com | encarregada (mãe da Francisca) | Estrelinhas |
| demo.miguel@example.com | encarregado (pai do Rodrigo) | Estrelinhas |

Escola: "Cantinho Feliz (demonstração)". Para uma apresentação ao vivo,
a conta mais visual costuma ser a de admin (vê tudo) ou a de um
encarregado (vê o "Hoje" da sua criança). Correr `npm run seed:demo`
de novo a repor tudo antes de uma apresentação, se precisares de dados
"frescos" do dia.

## Modelo de IA usado por etapa (para referência futura)

- Etapa 1: Sonnet 5, esforço médio.
- Etapa 2: Opus 5, esforço alto (schema + RLS = código crítico).
- Etapa 3: Sonnet 5, esforço médio para CRUD; considerar subir esforço
  especificamente para as políticas RLS das tabelas novas
  (avisos/mensagens) antes de dar a etapa como concluída.
