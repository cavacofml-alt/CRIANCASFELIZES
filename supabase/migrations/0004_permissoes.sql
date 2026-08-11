-- =====================================================================
-- Etapa 2 — Permissões de tabela (a camada por baixo do RLS)
-- =====================================================================
-- Há DUAS camadas de proteção, e ambas têm de estar certas:
--
--   1. GRANT  — "esta função de utilizador pode tocar nesta tabela?"
--   2. RLS    — "e, dentro dela, que linhas em concreto pode ver?"
--
-- Este ficheiro trata da camada 1. Sem ele, o comportamento fica à
-- mercê das permissões por omissão do projeto, que variam. Sendo
-- explícitos, o resultado é sempre o mesmo, hoje e daqui a um ano.
--
-- Regra aplicada:
--   * `anon` (visitante sem login) — ZERO acesso a dados de escolas,
--     crianças ou pessoas. Nem sequer chega ao RLS.
--   * `authenticated` (com login) — pode tocar nas tabelas, mas o RLS
--     decide as linhas. Só concedemos as operações para as quais
--     existe mesmo uma política; o resto seria sempre recusado.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Visitantes sem login não têm absolutamente nada.
-- ---------------------------------------------------------------------
revoke all on public.escolas               from anon;
revoke all on public.perfis                from anon;
revoke all on public.turmas                from anon;
revoke all on public.criancas              from anon;
revoke all on public.encarregados_criancas from anon;
revoke all on public.staff_turmas          from anon;

-- ---------------------------------------------------------------------
-- 2. Utilizadores autenticados — acesso à tabela, RLS filtra as linhas.
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 3. Novas tabelas criadas no futuro não devem ficar abertas ao `anon`
--    por omissão.
-- ---------------------------------------------------------------------
alter default privileges in schema public revoke all on tables from anon;
