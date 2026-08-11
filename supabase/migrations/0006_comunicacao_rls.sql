-- =====================================================================
-- Etapa 3 — Comunicação escola-família: RLS (código crítico de segurança)
-- =====================================================================
-- Segue os mesmos princípios de 0002_rls.sql: negar por omissão, sem
-- recursão (só funções `security definer`), isolamento por escola
-- sempre verificado.
--
-- Quem pode falar com quem (mensagens diretas):
--   * admin       <-> qualquer perfil da sua escola.
--   * staff       <-> encarregados dos educandos das suas turmas, e admin.
--   * encarregado <-> staff das turmas dos seus educandos, e admin.
-- Não existe staff <-> staff nem encarregado <-> encarregado: fora do
-- âmbito "comunicação escola-família" desta etapa.
--
-- Quem pode publicar no mural (avisos):
--   * admin  — para toda a escola ou para uma turma específica.
--   * staff  — só para as suas próprias turmas (nunca para toda a escola).
--   * encarregado — não publica, só lê.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Funções auxiliares novas (security definer, mesmo padrão de 0002)
-- ---------------------------------------------------------------------

-- Todos os perfis da escola do utilizador autenticado (usado só na
-- política de admin, que pode falar com qualquer pessoa da escola).
create or replace function public.auth_perfis_da_escola()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id from public.perfis p
  where p.escola_id = (
    select escola_id from public.perfis where id = (select auth.uid())
  );
$$;

-- Administradores da escola do utilizador autenticado.
create or replace function public.auth_admins_da_escola()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id from public.perfis p
  where p.papel = 'admin'
    and p.escola_id = (
      select escola_id from public.perfis where id = (select auth.uid())
    );
$$;

-- Staff que dá aulas às turmas dos educandos do encarregado autenticado.
create or replace function public.auth_staff_encarregado()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct st.staff_id
  from public.staff_turmas st
  where st.turma_id in (
    select c.turma_id
    from public.criancas c
    where c.turma_id is not null
      and c.id in (
        select ec.crianca_id from public.encarregados_criancas ec
        where ec.encarregado_id = (select auth.uid())
      )
  );
$$;

revoke execute on function
  public.auth_perfis_da_escola(),
  public.auth_admins_da_escola(),
  public.auth_staff_encarregado()
from public, anon;

grant execute on function
  public.auth_perfis_da_escola(),
  public.auth_admins_da_escola(),
  public.auth_staff_encarregado()
to authenticated;


-- ---------------------------------------------------------------------
-- PERFIS — falta a um encarregado ver quem lhe pode falar
-- ---------------------------------------------------------------------
-- Desde a Etapa 2, um encarregado só vê o seu próprio perfil (a escrita
-- e leitura da equipa chegariam "nas etapas seguintes", ver 0002_rls.sql).
-- A comunicação escola-família exige que ele veja, pelo menos, o nome de
-- quem lhe envia avisos e mensagens: o staff das turmas dos seus
-- educandos e a administração da sua escola. Nada além disso.
create policy "perfis_select_encarregado_equipa"
  on public.perfis for select to authenticated
  using (
    public.auth_papel() = 'encarregado'
    and escola_id = public.auth_escola_id()
    and (
      (papel = 'staff' and id in (select public.auth_staff_encarregado()))
      or (papel = 'admin' and id in (select public.auth_admins_da_escola()))
    )
  );


-- ---------------------------------------------------------------------
-- Ativar RLS
-- ---------------------------------------------------------------------
alter table public.avisos        enable row level security;
alter table public.mensagens     enable row level security;
alter table public.notificacoes  enable row level security;


-- ---------------------------------------------------------------------
-- AVISOS (mural)
-- ---------------------------------------------------------------------
create policy "avisos_select_admin"
  on public.avisos for select to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );

create policy "avisos_select_staff"
  on public.avisos for select to authenticated
  using (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and (turma_id is null or turma_id in (select public.auth_turmas_staff()))
  );

create policy "avisos_select_encarregado"
  on public.avisos for select to authenticated
  using (
    public.auth_papel() = 'encarregado'
    and escola_id = public.auth_escola_id()
    and (turma_id is null or turma_id in (select public.auth_turmas_encarregado()))
  );

-- Admin publica para toda a escola (turma_id nulo) ou para uma turma
-- concreta da sua escola.
create policy "avisos_insert_admin"
  on public.avisos for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
    and autor_id = (select auth.uid())
    and (turma_id is null or turma_id in (select public.auth_turmas_da_escola()))
  );

-- Staff só publica para as suas próprias turmas — nunca para toda a
-- escola nem para a turma de outro colega.
create policy "avisos_insert_staff"
  on public.avisos for insert to authenticated
  with check (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and autor_id = (select auth.uid())
    and turma_id in (select public.auth_turmas_staff())
  );

-- O autor pode apagar o seu próprio aviso; o admin pode apagar
-- qualquer aviso da sua escola (moderação).
create policy "avisos_delete_autor"
  on public.avisos for delete to authenticated
  using (autor_id = (select auth.uid()));

create policy "avisos_delete_admin"
  on public.avisos for delete to authenticated
  using (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
  );


-- ---------------------------------------------------------------------
-- MENSAGENS (diretas)
-- ---------------------------------------------------------------------
-- Ler: só quem participa na conversa. Não depende do papel — basta ser
-- remetente ou destinatário, exatamente como qualquer app de mensagens.
create policy "mensagens_select_participante"
  on public.mensagens for select to authenticated
  using (
    remetente_id = (select auth.uid())
    or destinatario_id = (select auth.uid())
  );

create policy "mensagens_insert_admin"
  on public.mensagens for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and escola_id = public.auth_escola_id()
    and remetente_id = (select auth.uid())
    and destinatario_id in (select public.auth_perfis_da_escola())
  );

create policy "mensagens_insert_staff"
  on public.mensagens for insert to authenticated
  with check (
    public.auth_papel() = 'staff'
    and escola_id = public.auth_escola_id()
    and remetente_id = (select auth.uid())
    and (
      destinatario_id in (select public.auth_encarregados_staff())
      or destinatario_id in (select public.auth_admins_da_escola())
    )
  );

create policy "mensagens_insert_encarregado"
  on public.mensagens for insert to authenticated
  with check (
    public.auth_papel() = 'encarregado'
    and escola_id = public.auth_escola_id()
    and remetente_id = (select auth.uid())
    and (
      destinatario_id in (select public.auth_staff_encarregado())
      or destinatario_id in (select public.auth_admins_da_escola())
    )
  );

-- Não há política de UPDATE: marcar uma mensagem como lida passa pela
-- função `marcar_mensagem_lida` abaixo, não por UPDATE direto — assim
-- garante-se que só o campo `lida_em` muda, nunca o conteúdo.


-- ---------------------------------------------------------------------
-- NOTIFICAÇÕES
-- ---------------------------------------------------------------------
-- Só o dono vê as suas notificações. Não há política de INSERT: só os
-- triggers abaixo (que correm como o dono das funções, não como o
-- utilizador) criam linhas nesta tabela.
create policy "notificacoes_select_proprio"
  on public.notificacoes for select to authenticated
  using (perfil_id = (select auth.uid()));


-- ---------------------------------------------------------------------
-- Funções RPC para marcar como lido
-- ---------------------------------------------------------------------
-- Em vez de expor UPDATE genérico (que deixaria o cliente reescrever
-- qualquer coluna), só se pode marcar como lido através destas funções.

create or replace function public.marcar_mensagem_lida(mensagem_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.mensagens
  set lida_em = now()
  where id = mensagem_id
    and destinatario_id = (select auth.uid())
    and lida_em is null;
end;
$$;

create or replace function public.marcar_notificacao_lida(notificacao_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notificacoes
  set lida = true
  where id = notificacao_id
    and perfil_id = (select auth.uid());
end;
$$;

create or replace function public.marcar_todas_notificacoes_lidas()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notificacoes
  set lida = true
  where perfil_id = (select auth.uid())
    and lida = false;
end;
$$;

revoke execute on function
  public.marcar_mensagem_lida(uuid),
  public.marcar_notificacao_lida(uuid),
  public.marcar_todas_notificacoes_lidas()
from public, anon;

grant execute on function
  public.marcar_mensagem_lida(uuid),
  public.marcar_notificacao_lida(uuid),
  public.marcar_todas_notificacoes_lidas()
to authenticated;


-- ---------------------------------------------------------------------
-- Triggers: gerar notificações automaticamente
-- ---------------------------------------------------------------------
-- Correm como `security definer`, por isso conseguem escrever em
-- `notificacoes` mesmo sem política de INSERT para `authenticated`.

create or replace function public.notificar_aviso()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  destinatario uuid;
begin
  if new.turma_id is null then
    for destinatario in
      select p.id from public.perfis p
      where p.escola_id = new.escola_id
        and p.papel in ('staff', 'encarregado')
        and p.id <> new.autor_id
    loop
      insert into public.notificacoes (escola_id, perfil_id, tipo, titulo, aviso_id)
      values (new.escola_id, destinatario, 'aviso', new.titulo, new.id);
    end loop;
  else
    for destinatario in
      select st.staff_id from public.staff_turmas st
      where st.turma_id = new.turma_id and st.staff_id <> new.autor_id
      union
      select ec.encarregado_id
      from public.encarregados_criancas ec
      join public.criancas c on c.id = ec.crianca_id
      where c.turma_id = new.turma_id and ec.encarregado_id <> new.autor_id
    loop
      insert into public.notificacoes (escola_id, perfil_id, tipo, titulo, aviso_id)
      values (new.escola_id, destinatario, 'aviso', new.titulo, new.id);
    end loop;
  end if;
  return new;
end;
$$;

create trigger avisos_notificar
  after insert on public.avisos
  for each row execute function public.notificar_aviso();

create or replace function public.notificar_mensagem()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notificacoes (escola_id, perfil_id, tipo, titulo, mensagem_id)
  values (new.escola_id, new.destinatario_id, 'mensagem', 'Nova mensagem', new.id);
  return new;
end;
$$;

create trigger mensagens_notificar
  after insert on public.mensagens
  for each row execute function public.notificar_mensagem();
