-- =====================================================================
-- Etapa 2 — Modelo de dados (apenas dados fictícios)
-- =====================================================================
-- Nota de arquitetura: todas as tabelas de conteúdo têm `escola_id`
-- desde o início. Isto custa pouco agora e evita reescrever tudo se o
-- projeto evoluir para multi-escola (SaaS) na Etapa 10.
-- =====================================================================

-- Papéis possíveis de um utilizador.
create type public.papel_utilizador as enum ('admin', 'staff', 'encarregado');

-- ---------------------------------------------------------------------
-- Escolas
-- ---------------------------------------------------------------------
create table public.escolas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Perfis — estende auth.users com papel e escola.
-- Não existe registo público: as contas são criadas pela escola.
-- Sem perfil, um utilizador autenticado não vê absolutamente nada.
-- ---------------------------------------------------------------------
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  escola_id uuid not null references public.escolas (id) on delete restrict,
  papel public.papel_utilizador not null,
  nome text not null,
  criado_em timestamptz not null default now()
);

create index perfis_escola_id_idx on public.perfis (escola_id);

-- ---------------------------------------------------------------------
-- Turmas
-- ---------------------------------------------------------------------
create table public.turmas (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas (id) on delete cascade,
  nome text not null,
  criado_em timestamptz not null default now(),
  -- Permite a chave estrangeira composta usada em `criancas`.
  unique (id, escola_id)
);

create index turmas_escola_id_idx on public.turmas (escola_id);

-- ---------------------------------------------------------------------
-- Crianças
-- ---------------------------------------------------------------------
create table public.criancas (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas (id) on delete cascade,
  turma_id uuid,
  nome text not null,
  data_nascimento date,
  criado_em timestamptz not null default now(),
  -- Garante, ao nível da base de dados, que uma criança nunca pode ser
  -- colocada numa turma de outra escola.
  foreign key (turma_id, escola_id)
    references public.turmas (id, escola_id) on delete set null
);

create index criancas_escola_id_idx on public.criancas (escola_id);
create index criancas_turma_id_idx on public.criancas (turma_id);

-- ---------------------------------------------------------------------
-- Ligação encarregado de educação <-> criança
-- ---------------------------------------------------------------------
create table public.encarregados_criancas (
  encarregado_id uuid not null references public.perfis (id) on delete cascade,
  crianca_id uuid not null references public.criancas (id) on delete cascade,
  parentesco text,
  criado_em timestamptz not null default now(),
  primary key (encarregado_id, crianca_id)
);

create index encarregados_criancas_crianca_idx
  on public.encarregados_criancas (crianca_id);

-- ---------------------------------------------------------------------
-- Ligação staff <-> turma
-- ---------------------------------------------------------------------
create table public.staff_turmas (
  staff_id uuid not null references public.perfis (id) on delete cascade,
  turma_id uuid not null references public.turmas (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (staff_id, turma_id)
);

create index staff_turmas_turma_idx on public.staff_turmas (turma_id);
