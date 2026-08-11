-- =====================================================================
-- Etapa 2 — DADOS FICTÍCIOS para desenvolvimento e testes
-- =====================================================================
-- ATENÇÃO: nenhum destes nomes corresponde a pessoas reais. Este
-- ficheiro NUNCA deve ser corrido numa base de dados com dados reais
-- de crianças (apaga tudo antes de inserir).
--
-- São criadas DUAS escolas de propósito: a segunda serve para provar
-- que uma escola nunca consegue ver os dados da outra.
--
-- Os identificadores são fixos (e não aleatórios) para os testes de
-- segurança poderem referir-se a eles diretamente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Limpeza (torna este ficheiro repetível sem duplicar nada)
-- ---------------------------------------------------------------------
delete from public.staff_turmas;
delete from public.encarregados_criancas;
delete from public.criancas;
delete from public.perfis;
delete from public.turmas;
delete from public.escolas;
delete from auth.users where email like '%@example.com';


-- ---------------------------------------------------------------------
-- Contas de autenticação fictícias
-- ---------------------------------------------------------------------
-- Palavra-passe de todas: Teste1234!
-- O domínio example.com é reservado por norma internacional: nunca
-- chega email a ninguém.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token,
  email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000',
  u.id, 'authenticated', 'authenticated', u.email,
  crypt('Teste1234!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  '', '', '', ''
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'rita.admin@example.com'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'ana.silva@example.com'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'bruno.costa@example.com'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'carla.ferreira@example.com'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'diogo.pinto@example.com'),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'paulo.admin@example.com')
) as u(id, email);

-- O Supabase exige uma "identidade" associada para o login por
-- email/palavra-passe funcionar.
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', u.id::text,
  now(), now(), now()
from auth.users u
where u.email like '%@example.com';


-- ---------------------------------------------------------------------
-- Escolas
-- ---------------------------------------------------------------------
insert into public.escolas (id, nome) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Creche Arco-Íris (fictícia)'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Creche Estrelinha (fictícia)');


-- ---------------------------------------------------------------------
-- Turmas
-- ---------------------------------------------------------------------
insert into public.turmas (id, escola_id, nome) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Borboletas'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Girassóis'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Luas');


-- ---------------------------------------------------------------------
-- Perfis (papel + escola de cada conta)
-- ---------------------------------------------------------------------
insert into public.perfis (id, escola_id, papel, nome) values
  ('11111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin',       'Rita Almeida'),
  ('22222222-2222-2222-2222-222222222222',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'staff',       'Ana Silva'),
  ('33333333-3333-3333-3333-333333333333',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'staff',       'Bruno Costa'),
  ('44444444-4444-4444-4444-444444444444',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'encarregado', 'Carla Ferreira'),
  ('55555555-5555-5555-5555-555555555555',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'encarregado', 'Diogo Pinto'),
  ('66666666-6666-6666-6666-666666666666',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'admin',       'Paulo Moreira');


-- ---------------------------------------------------------------------
-- Crianças (fictícias)
-- ---------------------------------------------------------------------
insert into public.criancas (id, escola_id, turma_id, nome, data_nascimento) values
  ('f1111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Matilde Ferreira', '2022-04-12'),
  ('f2222222-2222-2222-2222-222222222222',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Tomás Nunes',      '2022-09-30'),
  ('f3333333-3333-3333-3333-333333333333',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Leonor Pinto',     '2021-11-05'),
  ('f4444444-4444-4444-4444-444444444444',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Íris Almeida',     '2022-02-20');


-- ---------------------------------------------------------------------
-- Quem é encarregado de quem
-- ---------------------------------------------------------------------
-- Nota: o Tomás fica de propósito sem encarregado associado, para
-- testarmos que a Carla (mãe da Matilde, mesma turma) não o vê.
insert into public.encarregados_criancas (encarregado_id, crianca_id, parentesco) values
  ('44444444-4444-4444-4444-444444444444',
   'f1111111-1111-1111-1111-111111111111', 'Mãe'),
  ('55555555-5555-5555-5555-555555555555',
   'f3333333-3333-3333-3333-333333333333', 'Pai');


-- ---------------------------------------------------------------------
-- Que educador está em que turma
-- ---------------------------------------------------------------------
insert into public.staff_turmas (staff_id, turma_id) values
  ('22222222-2222-2222-2222-222222222222',
   'cccccccc-cccc-cccc-cccc-cccccccccccc'),  -- Ana   -> Borboletas
  ('33333333-3333-3333-3333-333333333333',
   'dddddddd-dddd-dddd-dddd-dddddddddddd');  -- Bruno -> Girassóis
