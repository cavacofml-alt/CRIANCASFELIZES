-- =====================================================================
-- Etapa 3 — DADOS FICTÍCIOS de comunicação (mural e mensagens)
-- =====================================================================
-- Usa os mesmos identificadores fixos de 0003_dados_ficticios.sql.
-- Repetível: apaga tudo o que este ficheiro cria antes de o recriar.
-- =====================================================================

delete from public.notificacoes
where escola_id in (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

delete from public.mensagens
where escola_id in (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

delete from public.avisos
where escola_id in (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

-- ---------------------------------------------------------------------
-- Avisos (mural) — cada insert dispara o trigger que gera notificações
-- ---------------------------------------------------------------------
insert into public.avisos (escola_id, turma_id, autor_id, titulo, corpo) values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null,
    '11111111-1111-1111-1111-111111111111', -- Rita (admin)
    'Reunião geral de pais',
    'No dia 20, às 18h, reunião geral no salão principal. (Aviso fictício.)'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '22222222-2222-2222-2222-222222222222', -- Ana (staff, Borboletas)
    'Fotografia escolar da turma',
    'Na quinta-feira as crianças da turma Borboletas trazem bata clara. (Aviso fictício.)'
  );

-- ---------------------------------------------------------------------
-- Mensagens diretas — cada insert dispara o trigger de notificação
-- ---------------------------------------------------------------------
insert into public.mensagens (escola_id, remetente_id, destinatario_id, corpo) values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '44444444-4444-4444-4444-444444444444', -- Carla (enc. da Matilde)
    '22222222-2222-2222-2222-222222222222', -- Ana (staff da turma da Matilde)
    'Bom dia, a Matilde hoje dorme mais tarde a sesta. Obrigada! (Mensagem fictícia.)'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222', -- Ana
    '44444444-4444-4444-4444-444444444444', -- Carla
    'Boa tarde, ficou registado, obrigada por avisar! (Mensagem fictícia.)'
  );
