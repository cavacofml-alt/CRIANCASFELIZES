-- =====================================================================
-- Etapa 5 — Relatórios diários e fotos: schema (apenas dados fictícios)
-- =====================================================================
-- Duas tabelas novas:
--   * relatorios_diarios — refeições, sono, fraldas; uma linha por
--     criança por dia, editável ao longo do dia (por isso tem
--     atualizado_em, diferente de presencas que só regista o momento).
--   * fotos               — metadados de fotos por turma; o ficheiro em
--     si fica no Supabase Storage (bucket `fotos-turmas`, ver
--     0015_relatorios_fotos_rls.sql).
--
-- Sono guardado como `time` (hora do relógio, sem fuso) e não
-- `timestamptz`: um educador regista "dormiu das 13h às 14h30", não um
-- instante preciso — usar `time` evita todo o tipo de bug de fuso
-- horário que já apanhámos noutras partes da aplicação.
-- =====================================================================

create type public.nivel_refeicao as enum (
  'nao_comeu', 'comeu_pouco', 'comeu_metade', 'comeu_tudo'
);

create table public.relatorios_diarios (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas (id) on delete cascade,
  crianca_id uuid not null,
  data date not null,
  pequeno_almoco public.nivel_refeicao,
  almoco public.nivel_refeicao,
  lanche public.nivel_refeicao,
  sono_inicio time,
  sono_fim time,
  fraldas_trocadas int not null default 0,
  notas text,
  registado_por uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  foreign key (crianca_id, escola_id)
    references public.criancas (id, escola_id) on delete cascade,
  unique (crianca_id, data),
  check (fraldas_trocadas >= 0),
  check (sono_fim is null or sono_inicio is not null)
);

create index relatorios_diarios_escola_id_idx on public.relatorios_diarios (escola_id);
create index relatorios_diarios_crianca_id_idx on public.relatorios_diarios (crianca_id, data);

-- Mantém `atualizado_em` correto sempre que o relatório é editado ao
-- longo do dia (refeição da manhã registada às 9h, sesta às 14h, etc.).
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger relatorios_diarios_atualizado_em
  before update on public.relatorios_diarios
  for each row execute function public.tocar_atualizado_em();


-- ---------------------------------------------------------------------
-- Fotos (por turma)
-- ---------------------------------------------------------------------
-- `caminho` é o caminho do ficheiro no Storage, sempre no formato
-- `<escola_id>/<turma_id>/<nome-do-ficheiro>` — as políticas de Storage
-- (0015) confiam nesse prefixo para decidir quem vê o quê.
create table public.fotos (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas (id) on delete cascade,
  turma_id uuid not null,
  caminho text not null unique,
  legenda text,
  autor_id uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now(),
  foreign key (turma_id, escola_id)
    references public.turmas (id, escola_id) on delete cascade
);

create index fotos_escola_id_idx on public.fotos (escola_id);
create index fotos_turma_id_idx on public.fotos (turma_id, criado_em);
