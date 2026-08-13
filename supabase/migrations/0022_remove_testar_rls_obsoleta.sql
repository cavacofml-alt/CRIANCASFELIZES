-- =====================================================================
-- Remove a função `testar_rls`, um protótipo antigo criado diretamente
-- no SQL Editor (não faz parte de nenhuma migration deste projeto),
-- substituído há muito por `scripts/test-rls.mjs` — o mesmo tipo de
-- teste adversarial, mas mais completo (104 verificações em vez de
-- ~20) e corrido com a chave `anon` a sério, como um browser.
-- Sinalizada pelo Supabase Advisor (search_path mutável). Não é
-- `security definer`, por isso o risco era sempre baixo, mas a função
-- está obsoleta e não deve continuar na base de dados.
-- =====================================================================

drop function if exists public.testar_rls();
