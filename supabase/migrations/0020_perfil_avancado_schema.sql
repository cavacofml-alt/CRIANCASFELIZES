-- =====================================================================
-- Etapa 12b — Perfil avançado: saúde, autorizações de recolha,
-- documentos e marcos de desenvolvimento (código crítico de segurança)
-- =====================================================================
-- Continuação da reformulação de UX pedida em 2026-08-12. Esta parte
-- mexe em dados de saúde de menores e em quem tem autorização para
-- levantar uma criança — por isso segue exatamente os mesmos princípios
-- de 0002_rls.sql (negar por omissão, sem recursão via funções security
-- definer, isolamento de escola sempre) e as lições da auditoria de
-- segurança (0018): caminhos de Storage validados com `uuid_seguro()`,
-- GRANT sempre revogado antes de concedido.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Saúde: colunas novas em `criancas`, sem tabela nova.
-- ---------------------------------------------------------------------
-- Reaproveita a RLS já existente de `criancas`: só o admin escreve
-- (criancas_update_admin), staff da turma e o próprio encarregado leem
-- (criancas_select_staff / criancas_select_encarregado). Não precisa de
-- nenhuma política nova.

alter table public.criancas
  add column if not exists alergias text,
  add column if not exists notas_saude text;


-- ---------------------------------------------------------------------
-- 2. Autorizações de recolha — lista de pessoas com autorização prévia
--    para levantar a criança, mesmo sem conta na aplicação (ex. avós).
--    Diferente de `presencas.levantado_por_nome`, que é só o registo
--    pontual de quem levantou naquele dia.
-- ---------------------------------------------------------------------

create table if not exists public.autorizacoes_recolha (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas (id) on delete cascade,
  crianca_id uuid not null,
  nome text not null,
  parentesco text,
  telefone text,
  criado_por uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now(),
  foreign key (crianca_id, escola_id)
    references public.criancas (id, escola_id) on delete cascade
);

create index if not exists autorizacoes_recolha_crianca_id_idx on public.autorizacoes_recolha (crianca_id);

alter table public.autorizacoes_recolha enable row level security;

drop policy if exists "autorizacoes_recolha_select_admin" on public.autorizacoes_recolha;
create policy "autorizacoes_recolha_select_admin"
  on public.autorizacoes_recolha for select to authenticated
  using (
    public.auth_papel() = 'admin'
    and crianca_id in (select public.auth_criancas_da_escola())
  );

drop policy if exists "autorizacoes_recolha_select_staff" on public.autorizacoes_recolha;
create policy "autorizacoes_recolha_select_staff"
  on public.autorizacoes_recolha for select to authenticated
  using (
    public.auth_papel() = 'staff'
    and crianca_id in (select public.auth_criancas_staff())
  );

drop policy if exists "autorizacoes_recolha_select_encarregado" on public.autorizacoes_recolha;
create policy "autorizacoes_recolha_select_encarregado"
  on public.autorizacoes_recolha for select to authenticated
  using (
    public.auth_papel() = 'encarregado'
    and crianca_id in (select public.auth_criancas_encarregado())
  );

-- Escrita: o admin gere qualquer criança da escola; o próprio
-- encarregado de educação gere a lista dos seus educandos — é a forma
-- mais direta de a família manter isto atualizado, sem depender de
-- pedir à escola para cada alteração.
drop policy if exists "autorizacoes_recolha_insert_admin" on public.autorizacoes_recolha;
create policy "autorizacoes_recolha_insert_admin"
  on public.autorizacoes_recolha for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_da_escola())
    and criado_por = (select auth.uid())
  );

drop policy if exists "autorizacoes_recolha_insert_encarregado" on public.autorizacoes_recolha;
create policy "autorizacoes_recolha_insert_encarregado"
  on public.autorizacoes_recolha for insert to authenticated
  with check (
    public.auth_papel() = 'encarregado'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_encarregado())
    and criado_por = (select auth.uid())
  );

drop policy if exists "autorizacoes_recolha_delete_admin" on public.autorizacoes_recolha;
create policy "autorizacoes_recolha_delete_admin"
  on public.autorizacoes_recolha for delete to authenticated
  using (
    public.auth_papel() = 'admin'
    and crianca_id in (select public.auth_criancas_da_escola())
  );

drop policy if exists "autorizacoes_recolha_delete_encarregado" on public.autorizacoes_recolha;
create policy "autorizacoes_recolha_delete_encarregado"
  on public.autorizacoes_recolha for delete to authenticated
  using (
    public.auth_papel() = 'encarregado'
    and crianca_id in (select public.auth_criancas_encarregado())
  );

revoke all on public.autorizacoes_recolha from anon, authenticated;
grant select, insert, delete on public.autorizacoes_recolha to authenticated;


-- ---------------------------------------------------------------------
-- 3. Marcos de desenvolvimento — várias entradas por criança ao longo
--    do tempo (não uma por dia, por isso sem unique(crianca_id, data)
--    como em `relatorios_diarios`).
-- ---------------------------------------------------------------------

create table if not exists public.marcos_desenvolvimento (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas (id) on delete cascade,
  crianca_id uuid not null,
  categoria text not null check (categoria in ('motor', 'linguagem', 'social', 'cognitivo', 'autonomia')),
  titulo text not null,
  descricao text,
  data date not null default current_date,
  registado_por uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now(),
  foreign key (crianca_id, escola_id)
    references public.criancas (id, escola_id) on delete cascade
);

create index if not exists marcos_desenvolvimento_crianca_id_idx on public.marcos_desenvolvimento (crianca_id, data);

alter table public.marcos_desenvolvimento enable row level security;

drop policy if exists "marcos_desenvolvimento_select_admin" on public.marcos_desenvolvimento;
create policy "marcos_desenvolvimento_select_admin"
  on public.marcos_desenvolvimento for select to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );

drop policy if exists "marcos_desenvolvimento_select_staff" on public.marcos_desenvolvimento;
create policy "marcos_desenvolvimento_select_staff"
  on public.marcos_desenvolvimento for select to authenticated
  using (
    public.auth_papel() = 'staff'
    and crianca_id in (select public.auth_criancas_staff())
  );

drop policy if exists "marcos_desenvolvimento_select_encarregado" on public.marcos_desenvolvimento;
create policy "marcos_desenvolvimento_select_encarregado"
  on public.marcos_desenvolvimento for select to authenticated
  using (
    public.auth_papel() = 'encarregado'
    and crianca_id in (select public.auth_criancas_encarregado())
  );

drop policy if exists "marcos_desenvolvimento_insert_admin" on public.marcos_desenvolvimento;
create policy "marcos_desenvolvimento_insert_admin"
  on public.marcos_desenvolvimento for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_da_escola())
    and registado_por = (select auth.uid())
  );

drop policy if exists "marcos_desenvolvimento_insert_staff" on public.marcos_desenvolvimento;
create policy "marcos_desenvolvimento_insert_staff"
  on public.marcos_desenvolvimento for insert to authenticated
  with check (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_staff())
    and registado_por = (select auth.uid())
  );

drop policy if exists "marcos_desenvolvimento_delete_admin" on public.marcos_desenvolvimento;
create policy "marcos_desenvolvimento_delete_admin"
  on public.marcos_desenvolvimento for delete to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );

revoke all on public.marcos_desenvolvimento from anon, authenticated;
grant select, insert, delete on public.marcos_desenvolvimento to authenticated;


-- ---------------------------------------------------------------------
-- 4. Documentos da criança — metadados + Storage privado.
-- ---------------------------------------------------------------------
-- Caminho: `<escola_id>/<crianca_id>/<nome-do-ficheiro>` — por criança,
-- não por turma como as fotos, porque um documento (ex. autorização
-- assinada, ficha médica) é sempre específico de uma criança.

create table if not exists public.documentos_crianca (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas (id) on delete cascade,
  crianca_id uuid not null,
  caminho text not null unique,
  nome_ficheiro text not null,
  autor_id uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now(),
  foreign key (crianca_id, escola_id)
    references public.criancas (id, escola_id) on delete cascade
);

create index if not exists documentos_crianca_crianca_id_idx on public.documentos_crianca (crianca_id);

alter table public.documentos_crianca enable row level security;

drop policy if exists "documentos_crianca_select_admin" on public.documentos_crianca;
create policy "documentos_crianca_select_admin"
  on public.documentos_crianca for select to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );

drop policy if exists "documentos_crianca_select_staff" on public.documentos_crianca;
create policy "documentos_crianca_select_staff"
  on public.documentos_crianca for select to authenticated
  using (
    public.auth_papel() = 'staff'
    and crianca_id in (select public.auth_criancas_staff())
  );

drop policy if exists "documentos_crianca_select_encarregado" on public.documentos_crianca;
create policy "documentos_crianca_select_encarregado"
  on public.documentos_crianca for select to authenticated
  using (
    public.auth_papel() = 'encarregado'
    and crianca_id in (select public.auth_criancas_encarregado())
  );

drop policy if exists "documentos_crianca_insert_admin" on public.documentos_crianca;
create policy "documentos_crianca_insert_admin"
  on public.documentos_crianca for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_da_escola())
    and autor_id = (select auth.uid())
    and caminho = escola_id::text || '/' || crianca_id::text || '/' || split_part(caminho, '/', 3)
  );

drop policy if exists "documentos_crianca_insert_staff" on public.documentos_crianca;
create policy "documentos_crianca_insert_staff"
  on public.documentos_crianca for insert to authenticated
  with check (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_staff())
    and autor_id = (select auth.uid())
    and caminho = escola_id::text || '/' || crianca_id::text || '/' || split_part(caminho, '/', 3)
  );

drop policy if exists "documentos_crianca_insert_encarregado" on public.documentos_crianca;
create policy "documentos_crianca_insert_encarregado"
  on public.documentos_crianca for insert to authenticated
  with check (
    public.auth_papel() = 'encarregado'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_encarregado())
    and autor_id = (select auth.uid())
    and caminho = escola_id::text || '/' || crianca_id::text || '/' || split_part(caminho, '/', 3)
  );

drop policy if exists "documentos_crianca_delete_admin" on public.documentos_crianca;
create policy "documentos_crianca_delete_admin"
  on public.documentos_crianca for delete to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );

drop policy if exists "documentos_crianca_delete_autor" on public.documentos_crianca;
create policy "documentos_crianca_delete_autor"
  on public.documentos_crianca for delete to authenticated
  using (autor_id = (select auth.uid()));

revoke all on public.documentos_crianca from anon, authenticated;
grant select, insert, delete on public.documentos_crianca to authenticated;

-- Storage: bucket privado próprio (não reaproveita `fotos-turmas` —
-- documentos são por criança, não por turma, e mais sensíveis).
insert into storage.buckets (id, name, public)
values ('documentos-criancas', 'documentos-criancas', false)
on conflict (id) do nothing;

drop policy if exists "documentos_criancas_storage_select" on storage.objects;
create policy "documentos_criancas_storage_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documentos-criancas'
    and (storage.foldername(name))[1] = public.auth_escola_id()::text
    and (
      public.auth_papel() = 'admin'
      or (
        public.auth_papel() = 'staff'
        and public.uuid_seguro((storage.foldername(name))[2]) in (select public.auth_criancas_staff())
      )
      or (
        public.auth_papel() = 'encarregado'
        and public.uuid_seguro((storage.foldername(name))[2]) in (select public.auth_criancas_encarregado())
      )
    )
  );

drop policy if exists "documentos_criancas_storage_insert" on storage.objects;
create policy "documentos_criancas_storage_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documentos-criancas'
    and (storage.foldername(name))[1] = public.auth_escola_id()::text
    and (
      (
        public.auth_papel() = 'admin'
        and public.uuid_seguro((storage.foldername(name))[2]) in (select public.auth_criancas_da_escola())
      )
      or (
        public.auth_papel() = 'staff'
        and public.uuid_seguro((storage.foldername(name))[2]) in (select public.auth_criancas_staff())
      )
      or (
        public.auth_papel() = 'encarregado'
        and public.uuid_seguro((storage.foldername(name))[2]) in (select public.auth_criancas_encarregado())
      )
    )
  );

drop policy if exists "documentos_criancas_storage_delete" on storage.objects;
create policy "documentos_criancas_storage_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'documentos-criancas'
    and (
      owner = (select auth.uid())
      or owner_id = (select auth.uid())::text
      or (
        public.auth_papel() = 'admin'
        and (storage.foldername(name))[1] = public.auth_escola_id()::text
      )
    )
  );
