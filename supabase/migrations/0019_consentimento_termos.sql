-- =====================================================================
-- Etapa 8 — Consentimento digital (checkbox) para os termos/política
-- =====================================================================
-- Preparação para dados reais: em vez de depender só de um documento em
-- papel, cada conta tem de aceitar explicitamente os termos/política de
-- privacidade no primeiro acesso (e sempre que o texto mudar de versão),
-- ficando registado quem aceitou, o quê e quando — sem isso, o middleware
-- da aplicação (src/lib/supabase/middleware.ts) bloqueia o acesso ao
-- painel e reencaminha para /consentimento.
--
-- Isto cobre o consentimento GERAL de utilização da app. O consentimento
-- para FOTOS e dados de saúde de uma criança específica continua a ser
-- tratado no processo de matrícula da escola (ver CONSENTIMENTO.md) — não
-- é substituído por esta checkbox.
-- =====================================================================

create table public.consentimentos_termos (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  versao text not null,
  aceite_em timestamptz not null default now(),
  unique (perfil_id, versao)
);

create index consentimentos_termos_perfil_id_idx
  on public.consentimentos_termos (perfil_id);

alter table public.consentimentos_termos enable row level security;

-- Cada pessoa só vê e regista o seu próprio consentimento. Não há
-- UPDATE nem DELETE de propósito: é um registo de auditoria, não um
-- estado editável — se o texto mudar de versão, regista-se uma nova
-- linha, nunca se apaga o histórico.
create policy "consentimentos_termos_select_proprio"
  on public.consentimentos_termos for select to authenticated
  using (perfil_id = (select auth.uid()));

create policy "consentimentos_termos_insert_proprio"
  on public.consentimentos_termos for insert to authenticated
  with check (perfil_id = (select auth.uid()));

revoke all on public.consentimentos_termos from anon, authenticated;

grant select, insert on public.consentimentos_termos to authenticated;
