-- =====================================================================
-- Etapa 5 — DADOS FICTÍCIOS de relatórios diários
-- =====================================================================
-- Usa os mesmos identificadores fixos de 0003_dados_ficticios.sql e a
-- mesma data fixa das presenças (2026-08-10), para os dois ecrãs
-- contarem a mesma história.
--
-- Fotos não são semeadas aqui: exigem um ficheiro real no Storage, o
-- que uma migration SQL não consegue fazer (não é só uma linha de
-- tabela). `npm run seed` trata disso à parte, com uma imagem de
-- teste; testar o upload em produção é aliás a melhor forma de validar
-- esta funcionalidade.
-- =====================================================================

delete from public.relatorios_diarios
where escola_id in (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

insert into public.relatorios_diarios (
  escola_id, crianca_id, data, pequeno_almoco, almoco, lanche,
  sono_inicio, sono_fim, fraldas_trocadas, notas, registado_por
) values
  (
    -- Matilde: relatório completo.
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'f1111111-1111-1111-1111-111111111111', -- Matilde
    '2026-08-10',
    'comeu_tudo', 'comeu_metade', 'comeu_tudo',
    '13:00', '14:30', 2,
    'Dia tranquilo, brincou muito no recreio. (Relatório fictício.)',
    '22222222-2222-2222-2222-222222222222' -- Ana
  ),
  (
    -- Tomás: relatório parcial (ainda a meio do dia).
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'f2222222-2222-2222-2222-222222222222', -- Tomás
    '2026-08-10',
    'comeu_pouco', null, null,
    null, null, 1,
    null,
    '22222222-2222-2222-2222-222222222222' -- Ana
  ),
  (
    -- Leonor: relatório completo.
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'f3333333-3333-3333-3333-333333333333', -- Leonor
    '2026-08-10',
    'comeu_tudo', 'comeu_tudo', 'comeu_metade',
    '12:45', '14:15', 3,
    'Precisou de mais colo para adormecer hoje. (Relatório fictício.)',
    '33333333-3333-3333-3333-333333333333' -- Bruno
  );
