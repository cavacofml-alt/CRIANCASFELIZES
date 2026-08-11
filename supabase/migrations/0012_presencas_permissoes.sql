-- =====================================================================
-- Etapa 4 — Permissões de tabela para presenças
-- =====================================================================
-- Mesma camada de GRANT explícita de 0004/0007: anon sem acesso,
-- authenticated só nas operações com política correspondente.
-- =====================================================================

revoke all on public.presencas from anon;

grant select, insert, update, delete
  on public.presencas to authenticated;
