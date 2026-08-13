-- =====================================================================
-- Etapa 12c — Foto de perfil da criança (avatar)
-- =====================================================================
-- Pedido do utilizador (2026-08-13), a caminho de um visual mais rico
-- inspirado num mockup de referência. Mesmo rigor de sempre: negar por
-- omissão, isolamento de escola, GRANT revogado antes de concedido,
-- caminhos de Storage validados com `uuid_seguro()` (lição da
-- auditoria, 0018).
--
-- Quem pode definir a foto: admin (qualquer criança da escola) e staff
-- (só das crianças da sua turma — são quem trata do dia a dia e tira a
-- foto). Para o staff, a permissão é dada à COLUNA `foto_caminho`
-- apenas (GRANT de coluna), não à linha toda — mesmo que a política de
-- RLS autorizasse a linha, o staff continua sem conseguir tocar em
-- nome/data_nascimento/alergias/notas_saude, que continuam reservados
-- ao admin. Duas camadas de proteção, como em todo o projeto.
-- =====================================================================

alter table public.criancas
  add column if not exists foto_caminho text;

grant update (foto_caminho) on public.criancas to authenticated;

drop policy if exists "criancas_update_staff_foto" on public.criancas;
create policy "criancas_update_staff_foto"
  on public.criancas for update to authenticated
  using (
    public.auth_papel() = 'staff'
    and turma_id in (select public.auth_turmas_staff())
  )
  with check (
    public.auth_papel() = 'staff'
    and turma_id in (select public.auth_turmas_staff())
  );

-- Storage: bucket privado próprio, um ficheiro "atual" por criança
-- (caminho `<escola_id>/<crianca_id>/<nome-do-ficheiro>`, como em
-- `documentos-criancas`).

insert into storage.buckets (id, name, public)
values ('avatares-criancas', 'avatares-criancas', false)
on conflict (id) do nothing;

drop policy if exists "avatares_criancas_storage_select" on storage.objects;
create policy "avatares_criancas_storage_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatares-criancas'
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

drop policy if exists "avatares_criancas_storage_insert" on storage.objects;
create policy "avatares_criancas_storage_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatares-criancas'
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
    )
  );

drop policy if exists "avatares_criancas_storage_update" on storage.objects;
create policy "avatares_criancas_storage_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatares-criancas'
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
    )
  )
  with check (
    bucket_id = 'avatares-criancas'
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
    )
  );

drop policy if exists "avatares_criancas_storage_delete" on storage.objects;
create policy "avatares_criancas_storage_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatares-criancas'
    and (
      public.auth_papel() = 'admin'
      and (storage.foldername(name))[1] = public.auth_escola_id()::text
    )
  );
