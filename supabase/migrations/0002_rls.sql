-- =====================================================================
-- Etapa 2 — Row Level Security (código crítico de segurança)
-- =====================================================================
-- Princípios seguidos:
--
-- 1. NEGAR POR OMISSÃO. RLS é ativado em todas as tabelas. Uma linha só
--    é visível se alguma política a autorizar explicitamente.
--
-- 2. SEM RECURSÃO. As políticas nunca consultam diretamente outra tabela
--    protegida por RLS (isso causa recursão infinita ou filtragem
--    inesperada). Toda a consulta cruzada passa por funções
--    `security definer`, que correm com privilégios elevados e
--    `search_path` bloqueado.
--
-- 3. ISOLAMENTO ENTRE ESCOLAS SEMPRE. Todas as políticas verificam a
--    escola do utilizador, não apenas o seu papel. Isto é o alicerce do
--    multi-escola da Etapa 10.
--
-- 4. ESCRITA MÍNIMA. Nesta etapa só o admin escreve. Staff e
--    encarregados são apenas leitura; as escritas deles chegam nas
--    etapas 4 e 5, com políticas próprias.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Funções auxiliares (security definer)
-- ---------------------------------------------------------------------
-- `set search_path = ''` impede que um utilizador malicioso crie objetos
-- com o mesmo nome noutro schema para sequestrar estas funções. Por isso
-- todos os nomes abaixo estão totalmente qualificados.

-- Escola do utilizador autenticado.
create or replace function public.auth_escola_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select escola_id from public.perfis where id = (select auth.uid());
$$;

-- Papel do utilizador autenticado.
create or replace function public.auth_papel()
returns public.papel_utilizador
language sql
stable
security definer
set search_path = ''
as $$
  select papel from public.perfis where id = (select auth.uid());
$$;

-- Turmas atribuídas ao staff autenticado.
create or replace function public.auth_turmas_staff()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select turma_id from public.staff_turmas where staff_id = (select auth.uid());
$$;

-- Crianças das turmas atribuídas ao staff autenticado.
create or replace function public.auth_criancas_staff()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id
  from public.criancas c
  where c.turma_id in (
    select st.turma_id from public.staff_turmas st
    where st.staff_id = (select auth.uid())
  );
$$;

-- Encarregados das crianças das turmas do staff autenticado.
create or replace function public.auth_encarregados_staff()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct ec.encarregado_id
  from public.encarregados_criancas ec
  where ec.crianca_id in (
    select c.id
    from public.criancas c
    where c.turma_id in (
      select st.turma_id from public.staff_turmas st
      where st.staff_id = (select auth.uid())
    )
  );
$$;

-- Educandos do encarregado autenticado.
create or replace function public.auth_criancas_encarregado()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select crianca_id from public.encarregados_criancas
  where encarregado_id = (select auth.uid());
$$;

-- Turmas dos educandos do encarregado autenticado.
create or replace function public.auth_turmas_encarregado()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct c.turma_id
  from public.criancas c
  where c.turma_id is not null
    and c.id in (
      select ec.crianca_id from public.encarregados_criancas ec
      where ec.encarregado_id = (select auth.uid())
    );
$$;

-- Todas as crianças da escola do utilizador autenticado (usado só nas
-- políticas de admin).
create or replace function public.auth_criancas_da_escola()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id from public.criancas c
  where c.escola_id = (
    select p.escola_id from public.perfis p where p.id = (select auth.uid())
  );
$$;

-- Todas as turmas da escola do utilizador autenticado (usado só nas
-- políticas de admin).
create or replace function public.auth_turmas_da_escola()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select t.id from public.turmas t
  where t.escola_id = (
    select p.escola_id from public.perfis p where p.id = (select auth.uid())
  );
$$;

-- Estas funções nunca devem ser chamáveis por visitantes não autenticados.
revoke execute on function
  public.auth_escola_id(),
  public.auth_papel(),
  public.auth_turmas_staff(),
  public.auth_criancas_staff(),
  public.auth_encarregados_staff(),
  public.auth_criancas_encarregado(),
  public.auth_turmas_encarregado(),
  public.auth_criancas_da_escola(),
  public.auth_turmas_da_escola()
from public, anon;

grant execute on function
  public.auth_escola_id(),
  public.auth_papel(),
  public.auth_turmas_staff(),
  public.auth_criancas_staff(),
  public.auth_encarregados_staff(),
  public.auth_criancas_encarregado(),
  public.auth_turmas_encarregado(),
  public.auth_criancas_da_escola(),
  public.auth_turmas_da_escola()
to authenticated;


-- ---------------------------------------------------------------------
-- Ativar RLS em todas as tabelas
-- ---------------------------------------------------------------------
alter table public.escolas               enable row level security;
alter table public.perfis                enable row level security;
alter table public.turmas                enable row level security;
alter table public.criancas              enable row level security;
alter table public.encarregados_criancas enable row level security;
alter table public.staff_turmas          enable row level security;


-- ---------------------------------------------------------------------
-- ESCOLAS
-- ---------------------------------------------------------------------
create policy "escolas_select_propria"
  on public.escolas for select to authenticated
  using (id = public.auth_escola_id());

create policy "escolas_update_admin"
  on public.escolas for update to authenticated
  using (public.auth_papel() = 'admin' and id = public.auth_escola_id())
  with check (public.auth_papel() = 'admin' and id = public.auth_escola_id());


-- ---------------------------------------------------------------------
-- PERFIS
-- ---------------------------------------------------------------------

-- Qualquer utilizador vê o seu próprio perfil.
create policy "perfis_select_proprio"
  on public.perfis for select to authenticated
  using (id = (select auth.uid()));

-- Admin vê todos os perfis da sua escola.
create policy "perfis_select_admin"
  on public.perfis for select to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );

-- Staff vê a restante equipa da sua escola (admin e staff).
create policy "perfis_select_staff_equipa"
  on public.perfis for select to authenticated
  using (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and papel in ('admin', 'staff')
  );

-- Staff vê apenas os encarregados das crianças das suas turmas —
-- não todos os encarregados da escola.
create policy "perfis_select_staff_encarregados"
  on public.perfis for select to authenticated
  using (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and papel = 'encarregado'
    and id in (select public.auth_encarregados_staff())
  );

-- Só o admin gere perfis, e apenas dentro da sua escola. O `with check`
-- impede que um admin crie ou mova um perfil para outra escola.
create policy "perfis_insert_admin"
  on public.perfis for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );

create policy "perfis_update_admin"
  on public.perfis for update to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  )
  with check (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );

create policy "perfis_delete_admin"
  on public.perfis for delete to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );


-- ---------------------------------------------------------------------
-- TURMAS
-- ---------------------------------------------------------------------
create policy "turmas_select_admin"
  on public.turmas for select to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );

create policy "turmas_select_staff"
  on public.turmas for select to authenticated
  using (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and id in (select public.auth_turmas_staff())
  );

create policy "turmas_select_encarregado"
  on public.turmas for select to authenticated
  using (
    public.auth_papel() = 'encarregado'
    and escola_id = public.auth_escola_id()
    and id in (select public.auth_turmas_encarregado())
  );

create policy "turmas_insert_admin"
  on public.turmas for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );

create policy "turmas_update_admin"
  on public.turmas for update to authenticated
  using (public.auth_papel() = 'admin' and escola_id = public.auth_escola_id())
  with check (public.auth_papel() = 'admin' and escola_id = public.auth_escola_id());

create policy "turmas_delete_admin"
  on public.turmas for delete to authenticated
  using (public.auth_papel() = 'admin' and escola_id = public.auth_escola_id());


-- ---------------------------------------------------------------------
-- CRIANÇAS  (dados de menores — a tabela mais sensível do sistema)
-- ---------------------------------------------------------------------
create policy "criancas_select_admin"
  on public.criancas for select to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );

-- Staff vê apenas as crianças das turmas que lhe estão atribuídas.
create policy "criancas_select_staff"
  on public.criancas for select to authenticated
  using (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and turma_id in (select public.auth_turmas_staff())
  );

-- Encarregado vê apenas os seus próprios educandos.
create policy "criancas_select_encarregado"
  on public.criancas for select to authenticated
  using (
    public.auth_papel() = 'encarregado'
    and escola_id = public.auth_escola_id()
    and id in (select public.auth_criancas_encarregado())
  );

create policy "criancas_insert_admin"
  on public.criancas for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );

create policy "criancas_update_admin"
  on public.criancas for update to authenticated
  using (public.auth_papel() = 'admin' and escola_id = public.auth_escola_id())
  with check (public.auth_papel() = 'admin' and escola_id = public.auth_escola_id());

create policy "criancas_delete_admin"
  on public.criancas for delete to authenticated
  using (public.auth_papel() = 'admin' and escola_id = public.auth_escola_id());


-- ---------------------------------------------------------------------
-- ENCARREGADOS <-> CRIANÇAS
-- ---------------------------------------------------------------------
-- Saber "quem é encarregado de quem" é informação sensível: é o que
-- determina quem pode levantar uma criança.

create policy "encarregados_criancas_select_admin"
  on public.encarregados_criancas for select to authenticated
  using (
    public.auth_papel() = 'admin'
    and crianca_id in (select public.auth_criancas_da_escola())
  );

create policy "encarregados_criancas_select_staff"
  on public.encarregados_criancas for select to authenticated
  using (
    public.auth_papel() = 'staff'
    and crianca_id in (select public.auth_criancas_staff())
  );

create policy "encarregados_criancas_select_proprio"
  on public.encarregados_criancas for select to authenticated
  using (
    public.auth_papel() = 'encarregado'
    and encarregado_id = (select auth.uid())
  );

create policy "encarregados_criancas_insert_admin"
  on public.encarregados_criancas for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and crianca_id in (select public.auth_criancas_da_escola())
  );

create policy "encarregados_criancas_delete_admin"
  on public.encarregados_criancas for delete to authenticated
  using (
    public.auth_papel() = 'admin'
    and crianca_id in (select public.auth_criancas_da_escola())
  );


-- ---------------------------------------------------------------------
-- STAFF <-> TURMAS
-- ---------------------------------------------------------------------
create policy "staff_turmas_select_admin"
  on public.staff_turmas for select to authenticated
  using (
    public.auth_papel() = 'admin'
    and turma_id in (select public.auth_turmas_da_escola())
  );

create policy "staff_turmas_select_proprio"
  on public.staff_turmas for select to authenticated
  using (
    public.auth_papel() = 'staff'
    and staff_id = (select auth.uid())
  );

create policy "staff_turmas_insert_admin"
  on public.staff_turmas for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and turma_id in (select public.auth_turmas_da_escola())
  );

create policy "staff_turmas_delete_admin"
  on public.staff_turmas for delete to authenticated
  using (
    public.auth_papel() = 'admin'
    and turma_id in (select public.auth_turmas_da_escola())
  );
