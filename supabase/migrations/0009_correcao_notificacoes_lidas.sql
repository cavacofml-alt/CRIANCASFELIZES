-- =====================================================================
-- Etapa 3 — Correção: notificações nunca eram marcadas como lidas
-- =====================================================================
-- 0006_comunicacao_rls.sql criou `marcar_mensagem_lida` (marca a
-- MENSAGEM como lida) e `marcar_notificacao_lida` (marca UMA
-- notificação, dado o seu id) — mas nenhuma página da aplicação tinha
-- forma de saber o id da notificação associada a cada mensagem ou
-- aviso, por isso o contador nunca descia. Estas duas funções resolvem
-- isso: marcam por tipo (mural) ou pelas mensagens já lidas (conversa).
-- =====================================================================

-- Ao visitar o mural, marca todas as notificações de avisos como lidas.
create or replace function public.marcar_notificacoes_tipo_lidas(tipo_param text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notificacoes
  set lida = true
  where perfil_id = (select auth.uid())
    and tipo = tipo_param
    and lida = false;
end;
$$;

-- Ao abrir uma conversa, marca só as notificações das mensagens dessa
-- conversa que acabaram de ser lidas — não mexe nas de outras conversas.
create or replace function public.marcar_notificacoes_mensagens_lidas(ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notificacoes
  set lida = true
  where perfil_id = (select auth.uid())
    and mensagem_id = any(ids)
    and lida = false;
end;
$$;

revoke execute on function
  public.marcar_notificacoes_tipo_lidas(text),
  public.marcar_notificacoes_mensagens_lidas(uuid[])
from public, anon;

grant execute on function
  public.marcar_notificacoes_tipo_lidas(text),
  public.marcar_notificacoes_mensagens_lidas(uuid[])
to authenticated;
