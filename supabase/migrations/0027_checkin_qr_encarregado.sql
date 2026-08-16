-- =====================================================================
-- Etapa 13 — Check-in/check-out pelo encarregado de educação (QR code)
-- =====================================================================
-- Pedido do utilizador (2026-08-16), inspirado no EducaBiz: um QR code
-- único à entrada da escola que os pais apontam a câmara para
-- registar a entrada/saída do seu educando, sem precisar de pedir à
-- educadora. Se o encarregado se esquecer, a equipa continua a poder
-- registar manualmente — isso já funciona, não muda nada aqui.
--
-- Até agora só admin/staff podiam escrever em `presencas`. Esta
-- migration abre uma via de escrita nova para o papel `encarregado`,
-- com o mesmo rigor de sempre: só os seus próprios educandos, só a
-- presença de hoje (nunca corrigir ou inventar um dia diferente — isso
-- continua reservado ao admin), e a proteção de autoria já existente
-- (`presencas_protege_autoria`, da Etapa 7) aplica-se sem alterações:
-- um encarregado não consegue reatribuir a autoria da entrada nem
-- sobrepor-se a uma saída já registada por outra pessoa.
-- =====================================================================

create or replace function public.data_hoje_lisboa()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Europe/Lisbon')::date;
$$;

revoke execute on function public.data_hoje_lisboa() from public, anon;
grant execute on function public.data_hoje_lisboa() to authenticated;

-- ---------------------------------------------------------------------
-- INSERT (registar entrada) — só o próprio educando, só hoje, e a
-- linha inserida tem de ser mesmo uma "entrada" (sem saída já
-- preenchida, o que só faz sentido para quem regista a posteriori).
-- ---------------------------------------------------------------------
drop policy if exists "presencas_insert_encarregado" on public.presencas;
create policy "presencas_insert_encarregado"
  on public.presencas for insert to authenticated
  with check (
    public.auth_papel() = 'encarregado'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_encarregado())
    and data = public.data_hoje_lisboa()
    and hora_entrada is not null
    and registado_entrada_por = (select auth.uid())
    and hora_saida is null
    and levantado_por_id is null
    and levantado_por_nome is null
    and registado_saida_por is null
  );

-- ---------------------------------------------------------------------
-- UPDATE (registar saída) — só o próprio educando, só hoje. A
-- proteção de autoria (quem regista a entrada/saída) já é garantida
-- pelo trigger existente, não precisa de ser repetida aqui.
-- ---------------------------------------------------------------------
drop policy if exists "presencas_update_encarregado" on public.presencas;
create policy "presencas_update_encarregado"
  on public.presencas for update to authenticated
  using (
    public.auth_papel() = 'encarregado'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_encarregado())
    and data = public.data_hoje_lisboa()
  )
  with check (
    public.auth_papel() = 'encarregado'
    and escola_id = public.auth_escola_id()
    and crianca_id in (select public.auth_criancas_encarregado())
    and data = public.data_hoje_lisboa()
  );
