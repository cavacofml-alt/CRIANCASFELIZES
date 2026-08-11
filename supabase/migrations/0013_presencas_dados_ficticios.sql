-- =====================================================================
-- Etapa 4 — DADOS FICTÍCIOS de presenças
-- =====================================================================
-- Usa os mesmos identificadores fixos de 0003_dados_ficticios.sql.
-- Repetível: apaga tudo o que este ficheiro cria antes de o recriar.
-- Data fixa (não "hoje") para os dados ficarem estáveis independentemente
-- de quando esta migration é corrida.
-- =====================================================================

delete from public.presencas
where escola_id in (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

insert into public.presencas (
  escola_id, crianca_id, data, hora_entrada, registado_entrada_por,
  hora_saida, levantado_por_id, levantado_por_nome, registado_saida_por
) values
  (
    -- Matilde: dia completo, levantada pela mãe (Carla).
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'f1111111-1111-1111-1111-111111111111', -- Matilde
    '2026-08-10',
    '2026-08-10 08:15:00+01', '22222222-2222-2222-2222-222222222222', -- Ana
    '2026-08-10 17:30:00+01',
    '44444444-4444-4444-4444-444444444444', 'Carla Ferreira', -- Carla
    '22222222-2222-2222-2222-222222222222' -- Ana
  ),
  (
    -- Tomás: só entrada — ainda "presente", para testar esse estado.
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'f2222222-2222-2222-2222-222222222222', -- Tomás
    '2026-08-10',
    '2026-08-10 08:20:00+01', '22222222-2222-2222-2222-222222222222', -- Ana
    null, null, null, null
  ),
  (
    -- Leonor: dia completo, levantada pelo pai (Diogo).
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'f3333333-3333-3333-3333-333333333333', -- Leonor
    '2026-08-10',
    '2026-08-10 08:00:00+01', '33333333-3333-3333-3333-333333333333', -- Bruno
    '2026-08-10 17:00:00+01',
    '55555555-5555-5555-5555-555555555555', 'Diogo Pinto', -- Diogo
    '33333333-3333-3333-3333-333333333333' -- Bruno
  );
