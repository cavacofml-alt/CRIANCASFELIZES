-- =====================================================================
-- Etapa 3 — Comunicação escola-família: schema (apenas dados fictícios)
-- =====================================================================
-- Três tabelas novas:
--   * avisos        — mural, para toda a escola ou para uma turma.
--   * mensagens      — conversas diretas entre duas pessoas.
--   * notificacoes  — avisos in-app gerados automaticamente (por
--                      trigger) quando há um aviso ou mensagem novos.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Avisos (mural)
-- ---------------------------------------------------------------------
-- `turma_id` nulo = aviso para toda a escola. Preenchido = só para
-- quem está ligado a essa turma (staff da turma + encarregados dos
-- educandos dessa turma).
create table public.avisos (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas (id) on delete cascade,
  turma_id uuid,
  autor_id uuid not null references public.perfis (id) on delete cascade,
  titulo text not null,
  corpo text not null,
  criado_em timestamptz not null default now(),
  -- Mesma garantia que `criancas`: a turma tem de pertencer à mesma escola.
  foreign key (turma_id, escola_id)
    references public.turmas (id, escola_id) on delete cascade
);

create index avisos_escola_id_idx on public.avisos (escola_id);
create index avisos_turma_id_idx on public.avisos (turma_id);

-- ---------------------------------------------------------------------
-- Mensagens diretas
-- ---------------------------------------------------------------------
create table public.mensagens (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas (id) on delete cascade,
  remetente_id uuid not null references public.perfis (id) on delete cascade,
  destinatario_id uuid not null references public.perfis (id) on delete cascade,
  corpo text not null,
  lida_em timestamptz,
  criado_em timestamptz not null default now(),
  check (remetente_id <> destinatario_id)
);

create index mensagens_escola_id_idx on public.mensagens (escola_id);
create index mensagens_remetente_idx on public.mensagens (remetente_id, criado_em);
create index mensagens_destinatario_idx on public.mensagens (destinatario_id, criado_em);

-- ---------------------------------------------------------------------
-- Notificações in-app
-- ---------------------------------------------------------------------
-- Nunca inseridas diretamente por um utilizador: só os triggers em
-- `avisos` e `mensagens` (ver 0006_comunicacao_rls.sql) criam linhas
-- aqui, por isso não há política de INSERT para `authenticated`.
create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas (id) on delete cascade,
  perfil_id uuid not null references public.perfis (id) on delete cascade,
  tipo text not null check (tipo in ('aviso', 'mensagem')),
  titulo text not null,
  aviso_id uuid references public.avisos (id) on delete cascade,
  mensagem_id uuid references public.mensagens (id) on delete cascade,
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);

create index notificacoes_perfil_idx on public.notificacoes (perfil_id, lida, criado_em);
