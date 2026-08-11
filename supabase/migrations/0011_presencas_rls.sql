-- =====================================================================
-- Etapa 4 — Presenças: RLS (código crítico de segurança)
-- =====================================================================
-- Mesmos princípios de sempre: negar por omissão, sem recursão (só
-- funções `security definer` já existentes de 0002_rls.sql), isolamento
-- por escola sempre verificado.
--
-- Quem regista entrada/saída: staff, só das crianças das suas turmas;
-- admin, de qualquer criança da escola. Encarregado nunca escreve —
-- só consulta as presenças dos seus próprios educandos.
-- =====================================================================

alter table public.presencas enable row level security;

-- ---------------------------------------------------------------------
-- SELECT
-- ---------------------------------------------------------------------
create policy "presencas_select_admin"
  on public.presencas for select to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );

create policy "presencas_select_staff"
  on public.presencas for select to authenticated
  using (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_staff())
  );

create policy "presencas_select_encarregado"
  on public.presencas for select to authenticated
  using (
    public.auth_papel() = 'encarregado'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_encarregado())
  );

-- ---------------------------------------------------------------------
-- INSERT (registar entrada)
-- ---------------------------------------------------------------------
create policy "presencas_insert_admin"
  on public.presencas for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_da_escola())
    and registado_entrada_por = (select auth.uid())
  );

create policy "presencas_insert_staff"
  on public.presencas for insert to authenticated
  with check (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_staff())
    and registado_entrada_por = (select auth.uid())
  );

-- ---------------------------------------------------------------------
-- UPDATE (registar saída / correções do próprio dia)
-- ---------------------------------------------------------------------
create policy "presencas_update_admin"
  on public.presencas for update to authenticated
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

create policy "presencas_update_staff"
  on public.presencas for update to authenticated
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

-- ---------------------------------------------------------------------
-- DELETE (só admin, para corrigir um registo enganado)
-- ---------------------------------------------------------------------
create policy "presencas_delete_admin"
  on public.presencas for delete to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );
