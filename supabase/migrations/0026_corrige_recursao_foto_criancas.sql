-- =====================================================================
-- Etapa 7b (correção de bug) — recursão infinita entre `fotos` e
-- `foto_criancas`
-- =====================================================================
-- A 0024 criou uma referência cruzada: a política de leitura de
-- `fotos` para o encarregado consulta `foto_criancas` diretamente, e
-- três políticas de `foto_criancas` (inserir como admin/staff, apagar)
-- consultam `fotos` diretamente. O Postgres recusa-se a resolver isto
-- ("infinite recursion detected in policy", 42P17) — confirmado ao
-- testar o envio de foto com marcação de criança.
--
-- Correção: a mesma técnica já usada em todo o projeto para este tipo
-- de situação — uma função `security definer` quebra o ciclo, porque
-- o seu corpo corre com os privilégios do dono da função (não do
-- utilizador autenticado), logo não volta a acionar a RLS de
-- `foto_criancas` a partir de dentro da política de `fotos`.
-- =====================================================================

create or replace function public.auth_fotos_encarregado()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select fc.foto_id
  from public.foto_criancas fc
  where fc.crianca_id in (
    select ec.crianca_id from public.encarregados_criancas ec
    where ec.encarregado_id = (select auth.uid())
  );
$$;

revoke execute on function public.auth_fotos_encarregado() from public, anon;
grant execute on function public.auth_fotos_encarregado() to authenticated;

drop policy if exists "fotos_select_encarregado" on public.fotos;
create policy "fotos_select_encarregado"
  on public.fotos for select to authenticated
  using (
    public.auth_papel() = 'encarregado'
    and escola_id = public.auth_escola_id()
    and id in (select public.auth_fotos_encarregado())
  );
