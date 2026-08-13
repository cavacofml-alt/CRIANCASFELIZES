-- =====================================================================
-- Correção encontrada pelo Supabase Advisor: 4 funções de trigger sem
-- `revoke execute` explícito
-- =====================================================================
-- `notificar_aviso`, `notificar_mensagem` (0006_comunicacao_rls.sql) e
-- `presencas_protege_autoria`, `relatorios_diarios_protege_autoria`
-- (0018_auditoria_seguranca_correcoes.sql) foram criadas como todas as
-- outras (security definer, search_path fixo), mas nunca tiveram o
-- `revoke execute ... from anon, authenticated` que o resto do projeto
-- sempre aplica.
--
-- Risco real: nenhum. Todas têm `returns trigger`, e o Postgres recusa
-- por si só chamar uma função desse tipo fora de um trigger (erro
-- "trigger functions can only be called as triggers") — não há forma
-- de as invocar através do endpoint /rest/v1/rpc/, mesmo com EXECUTE
-- concedido. O Advisor sinaliza-as na mesma porque não sabe disso à
-- partida; fecha-se por hábito de rigor e para o aviso desaparecer.
--
-- Revogar EXECUTE não afeta os triggers em si: o Postgres corre-os
-- automaticamente como parte do INSERT/UPDATE, sem depender do
-- privilégio EXECUTE de quem fez o pedido.
-- =====================================================================

revoke execute on function
  public.notificar_aviso(),
  public.notificar_mensagem(),
  public.presencas_protege_autoria(),
  public.relatorios_diarios_protege_autoria()
from public, anon, authenticated;
