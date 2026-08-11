-- =====================================================================
-- TESTE ADVERSARIAL DE SEGURANÇA (RLS)
-- =====================================================================
-- Este ficheiro não testa se a aplicação funciona. Testa se a base de
-- dados RECUSA o que tem de recusar.
--
-- Cada teste assume a identidade de um utilizador real (via `set role`
-- + claims JWT, exatamente como o Supabase faz quando alguém entra no
-- site) e tenta aceder a dados a que não deveria ter acesso.
--
-- Se a proteção estivesse apenas na aplicação, e não na base de dados,
-- todos estes testes falhavam.
--
-- Correr no SQL Editor DEPOIS de 0001, 0002 e 0003.
-- Resultado esperado: todas as linhas com "PASSOU".
-- =====================================================================

create or replace function public.testar_rls()
returns table (
  nr        int,
  quem      text,
  teste     text,
  esperado  text,
  obtido    text,
  resultado text
)
language plpgsql
as $$
declare
  n   int;
  c   int := 0;
  ok  boolean;
  txt text;

  -- Identificadores fixos definidos em 0003_dados_ficticios.sql
  id_rita   constant uuid := '11111111-1111-1111-1111-111111111111';
  id_ana    constant uuid := '22222222-2222-2222-2222-222222222222';
  id_bruno  constant uuid := '33333333-3333-3333-3333-333333333333';
  id_carla  constant uuid := '44444444-4444-4444-4444-444444444444';
  id_diogo  constant uuid := '55555555-5555-5555-5555-555555555555';
  id_paulo  constant uuid := '66666666-6666-6666-6666-666666666666';

  esc_arco  constant uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  esc_estr  constant uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  tur_borb  constant uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  tur_luas  constant uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

  cr_matilde constant uuid := 'f1111111-1111-1111-1111-111111111111';
  cr_tomas   constant uuid := 'f2222222-2222-2222-2222-222222222222';
  cr_leonor  constant uuid := 'f3333333-3333-3333-3333-333333333333';
  cr_iris    constant uuid := 'f4444444-4444-4444-4444-444444444444';
begin

  -- =================================================================
  -- 1. VISITANTE SEM LOGIN
  -- =================================================================
  perform set_config('request.jwt.claims', '', true);
  execute 'set local role anon';

  -- Um visitante pode ser barrado de duas formas legítimas: por não ter
  -- permissão na tabela (GRANT), ou por o RLS não lhe devolver linha
  -- nenhuma. Ambas são aceitáveis; o que não pode é ver dados.
  begin
    select count(*) into n from public.criancas;
    txt := n::text;
  exception when insufficient_privilege then
    txt := 'sem permissão';
  end;
  c := c+1; nr := c; quem := 'Visitante (sem login)';
  teste := 'Não vê nenhuma criança';
  esperado := '0 ou sem permissão'; obtido := txt;
  resultado := case when txt in ('0', 'sem permissão')
                    then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  begin
    select count(*) into n from public.perfis;
    txt := n::text;
  exception when insufficient_privilege then
    txt := 'sem permissão';
  end;
  c := c+1; nr := c; quem := 'Visitante (sem login)';
  teste := 'Não vê nenhum perfil';
  esperado := '0 ou sem permissão'; obtido := txt;
  resultado := case when txt in ('0', 'sem permissão')
                    then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  begin
    select count(*) into n from public.escolas;
    txt := n::text;
  exception when insufficient_privilege then
    txt := 'sem permissão';
  end;
  c := c+1; nr := c; quem := 'Visitante (sem login)';
  teste := 'Não vê nenhuma escola';
  esperado := '0 ou sem permissão'; obtido := txt;
  resultado := case when txt in ('0', 'sem permissão')
                    then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  execute 'reset role';

  -- =================================================================
  -- 2. CARLA FERREIRA — encarregada, mãe da Matilde (Borboletas)
  -- =================================================================
  perform set_config('request.jwt.claims',
    json_build_object('sub', id_carla, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  select count(*) into n from public.criancas;
  c := c+1; nr := c; quem := 'Carla (encarregada)';
  teste := 'Vê apenas a sua educanda';
  esperado := '1'; obtido := n::text;
  resultado := case when n = 1 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  select count(*) into n from public.criancas where id = cr_tomas;
  c := c+1; nr := c; quem := 'Carla (encarregada)';
  teste := 'NÃO vê o Tomás (mesma turma, outro encarregado)';
  esperado := '0'; obtido := n::text;
  resultado := case when n = 0 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  select count(*) into n from public.criancas where id = cr_leonor;
  c := c+1; nr := c; quem := 'Carla (encarregada)';
  teste := 'NÃO vê a Leonor (outra turma)';
  esperado := '0'; obtido := n::text;
  resultado := case when n = 0 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  select count(*) into n from public.criancas where id = cr_iris;
  c := c+1; nr := c; quem := 'Carla (encarregada)';
  teste := 'NÃO vê a Íris (outra escola)';
  esperado := '0'; obtido := n::text;
  resultado := case when n = 0 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  select count(*) into n from public.perfis;
  c := c+1; nr := c; quem := 'Carla (encarregada)';
  teste := 'Vê apenas o seu próprio perfil';
  esperado := '1'; obtido := n::text;
  resultado := case when n = 1 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  select count(*) into n from public.turmas;
  c := c+1; nr := c; quem := 'Carla (encarregada)';
  teste := 'Vê apenas a turma da sua educanda';
  esperado := '1'; obtido := n::text;
  resultado := case when n = 1 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  select count(*) into n from public.encarregados_criancas;
  c := c+1; nr := c; quem := 'Carla (encarregada)';
  teste := 'Vê apenas a sua própria ligação com a educanda';
  esperado := '1'; obtido := n::text;
  resultado := case when n = 1 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  begin
    insert into public.criancas (escola_id, turma_id, nome)
    values (esc_arco, tur_borb, 'Criança Intrusa');
    ok := true;
  exception when others then
    ok := false;
  end;
  c := c+1; nr := c; quem := 'Carla (encarregada)';
  teste := 'NÃO consegue inscrever uma criança';
  esperado := 'recusado'; obtido := case when ok then 'PERMITIDO' else 'recusado' end;
  resultado := case when not ok then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  -- Tentativa de escalada de privilégios.
  begin
    update public.perfis set papel = 'admin' where id = id_carla;
  exception when others then null;
  end;
  select papel::text into txt from public.perfis where id = id_carla;
  c := c+1; nr := c; quem := 'Carla (encarregada)';
  teste := 'NÃO consegue promover-se a administradora';
  esperado := 'encarregado'; obtido := coalesce(txt, '(sem leitura)');
  resultado := case when txt = 'encarregado' then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  execute 'reset role';

  -- =================================================================
  -- 3. ANA SILVA — educadora da turma Borboletas
  -- =================================================================
  perform set_config('request.jwt.claims',
    json_build_object('sub', id_ana, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  select count(*) into n from public.criancas;
  c := c+1; nr := c; quem := 'Ana (educadora Borboletas)';
  teste := 'Vê as 2 crianças da sua turma';
  esperado := '2'; obtido := n::text;
  resultado := case when n = 2 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  select count(*) into n from public.criancas where id = cr_leonor;
  c := c+1; nr := c; quem := 'Ana (educadora Borboletas)';
  teste := 'NÃO vê a Leonor (turma do colega Bruno)';
  esperado := '0'; obtido := n::text;
  resultado := case when n = 0 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  select count(*) into n from public.criancas where id = cr_iris;
  c := c+1; nr := c; quem := 'Ana (educadora Borboletas)';
  teste := 'NÃO vê crianças de outra escola';
  esperado := '0'; obtido := n::text;
  resultado := case when n = 0 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  select count(*) into n from public.perfis where papel = 'encarregado';
  c := c+1; nr := c; quem := 'Ana (educadora Borboletas)';
  teste := 'Vê apenas os encarregados da sua turma';
  esperado := '1'; obtido := n::text;
  resultado := case when n = 1 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  begin
    insert into public.criancas (escola_id, turma_id, nome)
    values (esc_arco, tur_borb, 'Criança Intrusa');
    ok := true;
  exception when others then
    ok := false;
  end;
  c := c+1; nr := c; quem := 'Ana (educadora Borboletas)';
  teste := 'NÃO consegue inscrever uma criança';
  esperado := 'recusado'; obtido := case when ok then 'PERMITIDO' else 'recusado' end;
  resultado := case when not ok then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  execute 'reset role';

  -- =================================================================
  -- 4. BRUNO COSTA — educador da turma Girassóis
  -- =================================================================
  perform set_config('request.jwt.claims',
    json_build_object('sub', id_bruno, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  select count(*) into n from public.criancas;
  c := c+1; nr := c; quem := 'Bruno (educador Girassóis)';
  teste := 'Vê apenas a criança da sua turma';
  esperado := '1'; obtido := n::text;
  resultado := case when n = 1 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  select count(*) into n
    from public.perfis where papel = 'encarregado' and id = id_carla;
  c := c+1; nr := c; quem := 'Bruno (educador Girassóis)';
  teste := 'NÃO vê a encarregada da turma do colega';
  esperado := '0'; obtido := n::text;
  resultado := case when n = 0 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  execute 'reset role';

  -- =================================================================
  -- 5. RITA ALMEIDA — administradora da Creche Arco-Íris
  -- =================================================================
  perform set_config('request.jwt.claims',
    json_build_object('sub', id_rita, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  select count(*) into n from public.criancas;
  c := c+1; nr := c; quem := 'Rita (admin Arco-Íris)';
  teste := 'Vê as 3 crianças da sua escola';
  esperado := '3'; obtido := n::text;
  resultado := case when n = 3 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  select count(*) into n from public.criancas where id = cr_iris;
  c := c+1; nr := c; quem := 'Rita (admin Arco-Íris)';
  teste := 'NÃO vê a criança da escola vizinha (isolamento)';
  esperado := '0'; obtido := n::text;
  resultado := case when n = 0 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  select count(*) into n from public.escolas;
  c := c+1; nr := c; quem := 'Rita (admin Arco-Íris)';
  teste := 'Vê apenas a sua própria escola';
  esperado := '1'; obtido := n::text;
  resultado := case when n = 1 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  begin
    insert into public.criancas (escola_id, turma_id, nome)
    values (esc_estr, tur_luas, 'Criança Injetada');
    ok := true;
  exception when others then
    ok := false;
  end;
  c := c+1; nr := c; quem := 'Rita (admin Arco-Íris)';
  teste := 'NÃO consegue inscrever criança noutra escola';
  esperado := 'recusado'; obtido := case when ok then 'PERMITIDO' else 'recusado' end;
  resultado := case when not ok then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  execute 'reset role';

  -- =================================================================
  -- 6. PAULO MOREIRA — administrador da escola vizinha
  -- =================================================================
  perform set_config('request.jwt.claims',
    json_build_object('sub', id_paulo, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  select count(*) into n from public.criancas;
  c := c+1; nr := c; quem := 'Paulo (admin Estrelinha)';
  teste := 'Vê apenas a criança da sua escola';
  esperado := '1'; obtido := n::text;
  resultado := case when n = 1 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  select count(*) into n from public.perfis;
  c := c+1; nr := c; quem := 'Paulo (admin Estrelinha)';
  teste := 'NÃO vê os perfis da escola vizinha';
  esperado := '1'; obtido := n::text;
  resultado := case when n = 1 then 'PASSOU' else '*** FALHOU ***' end;
  return next;

  execute 'reset role';

  -- =================================================================
  -- Limpeza: reverte qualquer alteração que um teste tenha conseguido
  -- fazer indevidamente (só acontece se algum teste tiver falhado).
  -- =================================================================
  delete from public.criancas
    where nome in ('Criança Intrusa', 'Criança Injetada');
  update public.perfis set papel = 'encarregado'
    where id in (id_carla, id_diogo) and papel <> 'encarregado';

  return;
end;
$$;


-- ---------------------------------------------------------------------
-- Correr os testes
-- ---------------------------------------------------------------------
select * from public.testar_rls();
