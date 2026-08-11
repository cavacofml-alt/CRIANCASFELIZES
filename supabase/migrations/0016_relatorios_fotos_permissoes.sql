-- =====================================================================
-- Etapa 5 — Permissões de tabela para relatórios diários e fotos
-- =====================================================================
-- Mesma camada de GRANT explícita de sempre: anon sem acesso,
-- authenticated só nas operações com política correspondente.
--
-- Não é preciso tratar `storage.objects`/`storage.buckets` aqui — o
-- Supabase já concede a `authenticated` as operações base nessas
-- tabelas por omissão; a segurança real está nas políticas de RLS
-- criadas em 0015_relatorios_fotos_rls.sql.
-- =====================================================================

revoke all on public.relatorios_diarios from anon;
revoke all on public.fotos              from anon;

grant select, insert, update, delete
  on public.relatorios_diarios to authenticated;

grant select, insert, delete
  on public.fotos to authenticated;
