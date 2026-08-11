-- =====================================================================
-- Etapa 4 — Presenças: schema (apenas dados fictícios)
-- =====================================================================
-- Uma linha por criança por dia: hora de entrada, hora de saída e quem
-- levantou a criança. `levantado_por_nome` é sempre preenchido no
-- check-out (mesmo quando a pessoa é um encarregado registado, cujo
-- nome fica também em `levantado_por_id`) para nunca perder o registo
-- de quem levou a criança, mesmo que essa pessoa não tenha conta na
-- aplicação (ex.: avó sem login).
-- =====================================================================

-- Necessário para a chave estrangeira composta abaixo (mesmo padrão de
-- `turmas`, que já tinha `unique (id, escola_id)`).
alter table public.criancas
  add constraint criancas_id_escola_id_key unique (id, escola_id);

create table public.presencas (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas (id) on delete cascade,
  crianca_id uuid not null,
  data date not null,
  hora_entrada timestamptz,
  registado_entrada_por uuid references public.perfis (id) on delete set null,
  hora_saida timestamptz,
  levantado_por_id uuid references public.perfis (id) on delete set null,
  levantado_por_nome text,
  registado_saida_por uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now(),
  -- Garante que a criança pertence mesmo a esta escola.
  foreign key (crianca_id, escola_id)
    references public.criancas (id, escola_id) on delete cascade,
  -- Um registo de presença por criança por dia.
  unique (crianca_id, data),
  -- Não pode haver saída sem entrada, nem saída sem se saber quem levantou.
  check (hora_saida is null or hora_entrada is not null),
  check (hora_saida is null or levantado_por_nome is not null)
);

create index presencas_escola_id_idx on public.presencas (escola_id);
create index presencas_crianca_id_idx on public.presencas (crianca_id, data);
create index presencas_data_idx on public.presencas (data);
