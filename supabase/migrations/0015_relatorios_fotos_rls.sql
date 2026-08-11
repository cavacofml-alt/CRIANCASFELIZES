-- =====================================================================
-- Etapa 5 — Relatórios diários e fotos: RLS (código crítico de segurança)
-- =====================================================================
-- Mesmos princípios de sempre. Esta migration cobre DUAS camadas:
--   1. As tabelas `relatorios_diarios` e `fotos` (metadados).
--   2. O Storage do Supabase (os ficheiros de imagem em si) — a
--      primeira vez que a aplicação usa Storage, por isso as políticas
--      aqui são tratadas com o mesmo cuidado das políticas de tabela.
-- =====================================================================


-- ---------------------------------------------------------------------
-- RELATÓRIOS DIÁRIOS
-- ---------------------------------------------------------------------
-- Mesmo padrão de `presencas`: staff só das suas turmas, admin de toda
-- a escola, encarregado só consulta os seus próprios educandos.

alter table public.relatorios_diarios enable row level security;

create policy "relatorios_diarios_select_admin"
  on public.relatorios_diarios for select to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );

create policy "relatorios_diarios_select_staff"
  on public.relatorios_diarios for select to authenticated
  using (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_staff())
  );

create policy "relatorios_diarios_select_encarregado"
  on public.relatorios_diarios for select to authenticated
  using (
    public.auth_papel() = 'encarregado'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_encarregado())
  );

create policy "relatorios_diarios_insert_admin"
  on public.relatorios_diarios for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_da_escola())
    and registado_por = (select auth.uid())
  );

create policy "relatorios_diarios_insert_staff"
  on public.relatorios_diarios for insert to authenticated
  with check (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_staff())
    and registado_por = (select auth.uid())
  );

create policy "relatorios_diarios_update_admin"
  on public.relatorios_diarios for update to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_da_escola())
  )
  with check (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_da_escola())
  );

create policy "relatorios_diarios_update_staff"
  on public.relatorios_diarios for update to authenticated
  using (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_staff())
  )
  with check (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_staff())
  );

create policy "relatorios_diarios_delete_admin"
  on public.relatorios_diarios for delete to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );


-- ---------------------------------------------------------------------
-- FOTOS (metadados)
-- ---------------------------------------------------------------------
-- Por turma: staff só das suas turmas, admin de toda a escola,
-- encarregado só das turmas dos seus educandos.

alter table public.fotos enable row level security;

create policy "fotos_select_admin"
  on public.fotos for select to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );

create policy "fotos_select_staff"
  on public.fotos for select to authenticated
  using (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and turma_id in (select public.auth_turmas_staff())
  );

create policy "fotos_select_encarregado"
  on public.fotos for select to authenticated
  using (
    public.auth_papel() = 'encarregado'
    and escola_id = public.auth_escola_id()
    and turma_id in (select public.auth_turmas_encarregado())
  );

create policy "fotos_insert_admin"
  on public.fotos for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
    and turma_id in (select public.auth_turmas_da_escola())
    and autor_id = (select auth.uid())
  );

create policy "fotos_insert_staff"
  on public.fotos for insert to authenticated
  with check (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and turma_id in (select public.auth_turmas_staff())
    and autor_id = (select auth.uid())
  );

-- O autor pode apagar a sua própria foto; o admin pode apagar qualquer
-- foto da sua escola (moderação) — mesmo padrão de `avisos`.
create policy "fotos_delete_autor"
  on public.fotos for delete to authenticated
  using (autor_id = (select auth.uid()));

create policy "fotos_delete_admin"
  on public.fotos for delete to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );


-- ---------------------------------------------------------------------
-- STORAGE — bucket privado para os ficheiros de fotos
-- ---------------------------------------------------------------------
-- Cada ficheiro é guardado com o caminho
-- `<escola_id>/<turma_id>/<nome-do-ficheiro>`. As políticas abaixo
-- extraem esses dois segmentos do caminho (`storage.foldername`) e
-- aplicam exatamente a mesma lógica de autorização das tabelas acima —
-- sem isto, um utilizador autenticado conseguiria descarregar fotos de
-- outra turma ou escola só por adivinhar o caminho.

insert into storage.buckets (id, name, public)
values ('fotos-turmas', 'fotos-turmas', false)
on conflict (id) do nothing;

create policy "fotos_turmas_storage_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'fotos-turmas'
    and (storage.foldername(name))[1] = public.auth_escola_id()::text
    and (
      public.auth_papel() = 'admin'
      or (
        public.auth_papel() = 'staff'
        and (storage.foldername(name))[2]::uuid in (select public.auth_turmas_staff())
      )
      or (
        public.auth_papel() = 'encarregado'
        and (storage.foldername(name))[2]::uuid in (select public.auth_turmas_encarregado())
      )
    )
  );

create policy "fotos_turmas_storage_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'fotos-turmas'
    and (storage.foldername(name))[1] = public.auth_escola_id()::text
    and (
      public.auth_papel() = 'admin'
      or (
        public.auth_papel() = 'staff'
        and (storage.foldername(name))[2]::uuid in (select public.auth_turmas_staff())
      )
    )
  );

-- Apagar um ficheiro: o próprio dono do upload, ou o admin da escola.
-- `owner_id` é a coluna atual do Supabase para o dono do objeto
-- (`owner` está deprecated mas comparamos as duas por segurança).
create policy "fotos_turmas_storage_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'fotos-turmas'
    and (
      owner = (select auth.uid())
      or owner_id = (select auth.uid())::text
      or (
        public.auth_papel() = 'admin'
        and (storage.foldername(name))[1] = public.auth_escola_id()::text
      )
    )
  );
