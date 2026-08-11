-- =====================================================================
-- Etapa 3 — Permissões de tabela para as novas tabelas de comunicação
-- =====================================================================
-- Mesma lógica de 0004_permissoes.sql: `anon` sem acesso nenhum,
-- `authenticated` só com as operações para as quais existe política.
--
-- `notificacoes` só recebe `select`: a escrita acontece via trigger
-- (que corre com privilégios do dono da função, não do utilizador) e a
-- marcação de leitura passa pelas funções RPC de 0006, nunca por UPDATE
-- direto na tabela.
-- =====================================================================

revoke all on public.avisos        from anon;
revoke all on public.mensagens     from anon;
revoke all on public.notificacoes  from anon;

grant select, insert, delete
  on public.avisos to authenticated;

grant select, insert
  on public.mensagens to authenticated;

grant select
  on public.notificacoes to authenticated;
