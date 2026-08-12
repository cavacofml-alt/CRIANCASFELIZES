-- =====================================================================
-- Etapa 7 — Correções encontradas na auditoria de segurança das RLS
-- =====================================================================
-- Esta migration corrige os problemas reais encontrados na revisão
-- adversarial feita antes de qualquer dado real (ver
-- AUDITORIA_SEGURANCA.md para a descrição completa de cada um). Nenhum
-- destes problemas permitia hoje, sem intervenção humana de um admin,
-- ver dados de outra criança/turma/escola — mas vários abriam portas
-- que tinham de ser fechadas antes da Etapa 8.
-- =====================================================================


-- =====================================================================
-- 1. Autoria de presenças e relatórios não podia ser reescrita
--    (achados M1 e M2 — os registos mais sensíveis do sistema: quem
--    fez o quê e quando, a uma criança).
-- =====================================================================
-- O INSERT já exigia `registado_entrada_por = auth.uid()`, mas o UPDATE
-- não repetia essa exigência — um membro do staff podia editar
-- silenciosamente qualquer registo antigo e atribuir a autoria a outra
-- pessoa. Resolvido com um trigger (RLS sozinho não compara o valor
-- antigo com o novo de forma simples num UPDATE), que:
--   * torna `registado_entrada_por` / `registado_por` imutáveis após o
--     insert;
--   * só deixa definir `registado_saida_por` uma vez, e só com o id de
--     quem está autenticado nesse momento;
--   * o admin continua a poder corrigir (é o papel dele: consertar
--     enganos), mas fica registado no log da base de dados quem o fez.

create or replace function public.presencas_protege_autoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.registado_entrada_por is distinct from old.registado_entrada_por
     and public.auth_papel() <> 'admin' then
    raise exception 'registado_entrada_por não pode ser alterado';
  end if;

  if old.registado_saida_por is not null
     and new.registado_saida_por is distinct from old.registado_saida_por
     and public.auth_papel() <> 'admin' then
    raise exception 'registado_saida_por já está definido';
  end if;

  if new.registado_saida_por is not null
     and new.registado_saida_por is distinct from old.registado_saida_por
     and new.registado_saida_por <> (select auth.uid())
     and public.auth_papel() <> 'admin' then
    raise exception 'só pode registar-se a si próprio como autor da saída';
  end if;

  return new;
end;
$$;

drop trigger if exists presencas_protege_autoria_trigger on public.presencas;
create trigger presencas_protege_autoria_trigger
  before update on public.presencas
  for each row
  execute function public.presencas_protege_autoria();


create or replace function public.relatorios_diarios_protege_autoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.registado_por is distinct from old.registado_por
     and public.auth_papel() <> 'admin' then
    raise exception 'registado_por não pode ser alterado';
  end if;

  return new;
end;
$$;

drop trigger if exists relatorios_diarios_protege_autoria_trigger on public.relatorios_diarios;
create trigger relatorios_diarios_protege_autoria_trigger
  before update on public.relatorios_diarios
  for each row
  execute function public.relatorios_diarios_protege_autoria();


-- =====================================================================
-- 2. Isolamento de escola reforçado nas funções auxiliares
--    (achados M3 e M4 — a única política de leitura de todo o schema
--    sem verificação de escola, alcançável através de uma atribuição
--    de turma mal feita).
-- =====================================================================
-- Antes, `auth_turmas_staff()` e `auth_criancas_staff()` confiavam
-- inteiramente em `staff_turmas` estar sempre corretamente preenchida.
-- Agora verificam também, elas próprias, que a turma pertence à mesma
-- escola do utilizador autenticado — mesmo que uma atribuição de turma
-- erradamente ligue um membro do staff a uma turma de outra escola
-- (achado M3, corrigido abaixo), estas funções já não devolveriam essa
-- turma/criança.

create or replace function public.auth_turmas_staff()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select st.turma_id
  from public.staff_turmas st
  join public.turmas t on t.id = st.turma_id
  where st.staff_id = (select auth.uid())
    and t.escola_id = (
      select p.escola_id from public.perfis p where p.id = (select auth.uid())
    );
$$;

create or replace function public.auth_criancas_staff()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id
  from public.criancas c
  where c.turma_id in (select public.auth_turmas_staff())
    and c.escola_id = (
      select p.escola_id from public.perfis p where p.id = (select auth.uid())
    );
$$;

create or replace function public.auth_encarregados_staff()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct ec.encarregado_id
  from public.encarregados_criancas ec
  where ec.crianca_id in (select public.auth_criancas_staff());
$$;


-- =====================================================================
-- 3. `staff_turmas_insert_admin` validava a turma mas não o membro do
--    staff (achado M3) — um admin podia ligar um perfil de outra
--    escola, ou de outro papel, a uma das suas turmas. E
--    `encarregados_criancas_insert_admin` validava a criança mas não o
--    encarregado (achado M5) — mesmo problema, do outro lado.
-- =====================================================================
-- Seguindo o princípio 2 do topo de 0002_rls.sql (nunca consultar
-- diretamente outra tabela protegida por RLS dentro de uma política),
-- estas duas verificações passam por funções `security definer`, tal
-- como todas as outras.

create or replace function public.eh_staff_da_escola(perfil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
    where id = perfil_id
      and papel = 'staff'
      and escola_id = (
        select p.escola_id from public.perfis p where p.id = (select auth.uid())
      )
  );
$$;

create or replace function public.eh_encarregado_da_escola(perfil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
    where id = perfil_id
      and papel = 'encarregado'
      and escola_id = (
        select p.escola_id from public.perfis p where p.id = (select auth.uid())
      )
  );
$$;

revoke execute on function
  public.eh_staff_da_escola(uuid),
  public.eh_encarregado_da_escola(uuid)
from public, anon;

grant execute on function
  public.eh_staff_da_escola(uuid),
  public.eh_encarregado_da_escola(uuid)
to authenticated;

drop policy if exists "staff_turmas_insert_admin" on public.staff_turmas;
create policy "staff_turmas_insert_admin"
  on public.staff_turmas for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and turma_id in (select public.auth_turmas_da_escola())
    and public.eh_staff_da_escola(staff_id)
  );

drop policy if exists "encarregados_criancas_insert_admin" on public.encarregados_criancas;
create policy "encarregados_criancas_insert_admin"
  on public.encarregados_criancas for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and crianca_id in (select public.auth_criancas_da_escola())
    and public.eh_encarregado_da_escola(encarregado_id)
  );


-- =====================================================================
-- 4. Storage: caminho mal formado podia derrubar a leitura da galeria
--    de toda a escola, e o admin podia inserir fotos com um segmento
--    de turma inválido (achado M7).
-- =====================================================================
-- `(storage.foldername(name))[2]::uuid` rebenta com erro se o segmento
-- não for um uuid válido — e o Postgres não garante avaliar primeiro a
-- condição que filtra pela escola. `uuid_seguro()` devolve `null` em
-- vez de rebentar, o que faz o `in (...)` falhar em silêncio (nega o
-- acesso, como deve ser) em vez de partir a página toda.

create or replace function public.uuid_seguro(valor text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when valor ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then valor::uuid
    else null
  end;
$$;

revoke execute on function public.uuid_seguro(text) from public, anon;
grant execute on function public.uuid_seguro(text) to authenticated;

drop policy if exists "fotos_turmas_storage_select" on storage.objects;
create policy "fotos_turmas_storage_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'fotos-turmas'
    and (storage.foldername(name))[1] = public.auth_escola_id()::text
    and (
      public.auth_papel() = 'admin'
      or (
        public.auth_papel() = 'staff'
        and public.uuid_seguro((storage.foldername(name))[2]) in (select public.auth_turmas_staff())
      )
      or (
        public.auth_papel() = 'encarregado'
        and public.uuid_seguro((storage.foldername(name))[2]) in (select public.auth_turmas_encarregado())
      )
    )
  );

drop policy if exists "fotos_turmas_storage_insert" on storage.objects;
create policy "fotos_turmas_storage_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'fotos-turmas'
    and (storage.foldername(name))[1] = public.auth_escola_id()::text
    and (
      (
        public.auth_papel() = 'admin'
        and public.uuid_seguro((storage.foldername(name))[2]) in (select public.auth_turmas_da_escola())
      )
      or (
        public.auth_papel() = 'staff'
        and public.uuid_seguro((storage.foldername(name))[2]) in (select public.auth_turmas_staff())
      )
    )
  );


-- =====================================================================
-- 4b. `fotos.caminho` não era validado contra a própria `escola_id`/
--     `turma_id` da linha (achado B1) — um membro do staff podia
--     inserir metadados na sua turma a apontar para o caminho de outra
--     turma. O Storage já impedia o download real, mas isto fecha
--     também a incoerência entre os metadados e o ficheiro.
-- =====================================================================

drop policy if exists "fotos_insert_admin" on public.fotos;
create policy "fotos_insert_admin"
  on public.fotos for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
    and turma_id in (select public.auth_turmas_da_escola())
    and autor_id = (select auth.uid())
    and caminho = escola_id::text || '/' || turma_id::text || '/' || split_part(caminho, '/', 3)
  );

drop policy if exists "fotos_insert_staff" on public.fotos;
create policy "fotos_insert_staff"
  on public.fotos for insert to authenticated
  with check (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and turma_id in (select public.auth_turmas_staff())
    and autor_id = (select auth.uid())
    and caminho = escola_id::text || '/' || turma_id::text || '/' || split_part(caminho, '/', 3)
  );


-- =====================================================================
-- 5. `tocar_atualizado_em()` era a única função do projeto sem
--    `set search_path = ''` (achado B4) — risco baixo (não é
--    `security definer`), mas quebra o padrão declarado no topo de
--    0002_rls.sql. Corrigido por consistência.
-- =====================================================================

create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;


-- =====================================================================
-- 6. Camada de GRANT: fechar o excedente que vem por omissão do
--    Supabase (achado M6) — as migrations anteriores concediam as
--    operações certas a `authenticated`, mas nunca revogavam primeiro o
--    que o Supabase concede por omissão a tabelas novas. Hoje o RLS
--    nega tudo o que não tem política, mas a segunda camada (GRANT) não
--    estava mesmo fechada como os comentários diziam.
-- =====================================================================

revoke all on
  public.escolas,
  public.perfis,
  public.turmas,
  public.criancas,
  public.encarregados_criancas,
  public.staff_turmas,
  public.avisos,
  public.mensagens,
  public.notificacoes,
  public.presencas,
  public.relatorios_diarios,
  public.fotos
from authenticated;

grant select, update
  on public.escolas to authenticated;

grant select, insert, update, delete
  on public.perfis to authenticated;

grant select, insert, update, delete
  on public.turmas to authenticated;

grant select, insert, update, delete
  on public.criancas to authenticated;

grant select, insert, delete
  on public.encarregados_criancas to authenticated;

grant select, insert, delete
  on public.staff_turmas to authenticated;

grant select, insert, delete
  on public.avisos to authenticated;

grant select, insert
  on public.mensagens to authenticated;

grant select
  on public.notificacoes to authenticated;

grant select, insert, update, delete
  on public.presencas to authenticated;

grant select, insert, update, delete
  on public.relatorios_diarios to authenticated;

grant select, insert, delete
  on public.fotos to authenticated;
