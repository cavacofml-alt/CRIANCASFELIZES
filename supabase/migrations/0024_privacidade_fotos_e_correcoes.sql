-- =====================================================================
-- Etapa 7b — Segunda auditoria de segurança (achados de revisão externa)
-- =====================================================================
-- Duas revisões externas (Gemini e ChatGPT) foram pedidas pelo
-- utilizador para auditar o projeto antes da Etapa 8 (dados reais). A
-- maioria dos achados do Gemini não correspondia ao código real (foi
-- verificado item a item e descartado); os achados do ChatGPT foram
-- confirmados um a um contra o código antes desta migration ser
-- escrita. Esta migration corrige os achados confirmados.
--
-- O mais importante, de longe, é o primeiro: as fotos eram visíveis a
-- toda a família da turma, não só à família da criança fotografada —
-- o que contradizia diretamente a promessa feita em CONSENTIMENTO.md
-- ("visíveis apenas aos encarregados de educação dessa criança"). Isto
-- é tratado como código crítico, com o mesmo rigor da Etapa 7.
-- =====================================================================


-- =====================================================================
-- 1. Fotos: privacidade por criança, não só por turma
-- =====================================================================
-- Antes: uma foto pertencia a uma turma; qualquer encarregado dessa
-- turma via a foto inteira, mesmo que o seu educando não estivesse
-- nela — e mesmo que outra criança da foto não tivesse autorização
-- para ser fotografada.
--
-- Agora: uma foto continua a pertencer a uma turma (staff/admin da
-- turma continuam a vê-la e a geri-la — isso é trabalho normal da
-- equipa), mas cada foto é também associada às crianças que nela
-- aparecem, através de `foto_criancas`. Um encarregado só vê uma foto
-- se o seu educando estiver explicitamente marcado nela. E uma criança
-- só pode ser marcada numa foto se tiver `consentimento_fotos = true`
-- — a base de dados impede fisicamente que isso seja contornado.

alter table public.criancas
  add column if not exists consentimento_fotos boolean not null default true;

comment on column public.criancas.consentimento_fotos is
  'Autorização dos encarregados de educação para fotografar e publicar '
  'fotos da criança na aplicação (ver CONSENTIMENTO.md, secção 2). '
  'Recolhida no processo de matrícula da escola. O valor por omissão '
  '(true) serve para não quebrar o fluxo de demonstração com dados '
  'fictícios — antes de qualquer criança real ser registada (Etapa 8), '
  'este campo tem de ser revisto e definido corretamente para cada '
  'criança, a partir do documento de consentimento assinado.';

create table if not exists public.foto_criancas (
  foto_id uuid not null references public.fotos (id) on delete cascade,
  crianca_id uuid not null references public.criancas (id) on delete cascade,
  primary key (foto_id, crianca_id)
);

create index if not exists foto_criancas_crianca_id_idx
  on public.foto_criancas (crianca_id);

alter table public.foto_criancas enable row level security;

-- Ver as marcações: mesma regra de quem pode ver a foto em si (admin
-- e staff da turma continuam a gerir a turma toda), mais o encarregado
-- restrito às marcações dos seus próprios educandos.
drop policy if exists "foto_criancas_select_admin" on public.foto_criancas;
create policy "foto_criancas_select_admin"
  on public.foto_criancas for select to authenticated
  using (
    public.auth_papel() = 'admin'
    and crianca_id in (select public.auth_criancas_da_escola())
  );

drop policy if exists "foto_criancas_select_staff" on public.foto_criancas;
create policy "foto_criancas_select_staff"
  on public.foto_criancas for select to authenticated
  using (
    public.auth_papel() = 'staff'
    and crianca_id in (select public.auth_criancas_staff())
  );

drop policy if exists "foto_criancas_select_encarregado" on public.foto_criancas;
create policy "foto_criancas_select_encarregado"
  on public.foto_criancas for select to authenticated
  using (
    public.auth_papel() = 'encarregado'
    and crianca_id in (select public.auth_criancas_encarregado())
  );

-- Marcar uma criança numa foto: só quem pode inserir a foto em si
-- (admin da escola, staff da turma), e só se a criança tiver
-- consentimento de fotos — isto é o que fecha, ao nível da base de
-- dados, a promessa do CONSENTIMENTO.md.
drop policy if exists "foto_criancas_insert_admin" on public.foto_criancas;
create policy "foto_criancas_insert_admin"
  on public.foto_criancas for insert to authenticated
  with check (
    public.auth_papel() = 'admin'
    and crianca_id in (
      select id from public.criancas
      where escola_id = public.auth_escola_id()
        and consentimento_fotos
    )
    and exists (
      select 1 from public.fotos f
      where f.id = foto_id and f.escola_id = public.auth_escola_id()
    )
  );

drop policy if exists "foto_criancas_insert_staff" on public.foto_criancas;
create policy "foto_criancas_insert_staff"
  on public.foto_criancas for insert to authenticated
  with check (
    public.auth_papel() = 'staff'
    and crianca_id in (
      select id from public.criancas
      where id in (select public.auth_criancas_staff())
        and consentimento_fotos
    )
    and exists (
      select 1 from public.fotos f
      where f.id = foto_id and f.turma_id in (select public.auth_turmas_staff())
    )
  );

-- Apagar uma marcação: quem pode apagar a foto em si (autor ou admin).
drop policy if exists "foto_criancas_delete" on public.foto_criancas;
create policy "foto_criancas_delete"
  on public.foto_criancas for delete to authenticated
  using (
    exists (
      select 1 from public.fotos f
      where f.id = foto_id
        and (f.autor_id = (select auth.uid()) or public.auth_papel() = 'admin')
    )
  );

revoke all on public.foto_criancas from anon, authenticated;
grant select, insert, delete on public.foto_criancas to authenticated;

-- A parte que realmente fecha a fuga: a leitura da família passa a
-- exigir uma marcação explícita da própria criança, não só a turma.
drop policy if exists "fotos_select_encarregado" on public.fotos;
create policy "fotos_select_encarregado"
  on public.fotos for select to authenticated
  using (
    public.auth_papel() = 'encarregado'
    and escola_id = public.auth_escola_id()
    and id in (
      select foto_id from public.foto_criancas
      where crianca_id in (select public.auth_criancas_encarregado())
    )
  );


-- =====================================================================
-- 2. `mensagens_select_participante` sem verificação de escola
-- =====================================================================
-- Não era explorável com os dados válidos de hoje (as políticas de
-- INSERT já impedem mensagens entre escolas diferentes), mas a leitura
-- não devia depender só disso — é uma fronteira de segurança fraca.
-- Corrigido por defesa em profundidade, no mesmo espírito da Etapa 7.

drop policy if exists "mensagens_select_participante" on public.mensagens;
create policy "mensagens_select_participante"
  on public.mensagens for select to authenticated
  using (
    escola_id = public.auth_escola_id()
    and (
      remetente_id = (select auth.uid())
      or destinatario_id = (select auth.uid())
    )
  );


-- =====================================================================
-- 3. `auth_staff_encarregado()` sem verificação de escola
-- =====================================================================
-- A Etapa 7 (0018) corrigiu as funções irmãs (`auth_turmas_staff`,
-- `auth_criancas_staff`, `auth_encarregados_staff`) para nunca
-- confiarem apenas em relações internas sem confirmar a escola — esta
-- ficou por corrigir. Defesa em profundidade: mesmo que uma
-- inconsistência de dados ligasse um encarregado a uma criança de
-- outra escola, esta função não devolveria staff dessa outra escola.

create or replace function public.auth_staff_encarregado()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct st.staff_id
  from public.staff_turmas st
  join public.turmas t on t.id = st.turma_id
  where t.escola_id = public.auth_escola_id()
    and st.turma_id in (
      select c.turma_id
      from public.criancas c
      where c.turma_id is not null
        and c.escola_id = public.auth_escola_id()
        and c.id in (
          select ec.crianca_id from public.encarregados_criancas ec
          where ec.encarregado_id = (select auth.uid())
        )
    );
$$;


-- =====================================================================
-- 4. `criancas.foto_caminho` sem validação estrutural
-- =====================================================================
-- Mesma lição da Etapa 7 (0018, achado B1) aplicada agora ao avatar: o
-- valor gravado tem de corresponder à própria escola/criança da linha.
-- O Storage já impedia o download real de um caminho indevido, mas
-- isto fecha também a incoerência entre os metadados e o ficheiro.

drop policy if exists "criancas_update_staff_foto" on public.criancas;
create policy "criancas_update_staff_foto"
  on public.criancas for update to authenticated
  using (
    public.auth_papel() = 'staff'
    and turma_id in (select public.auth_turmas_staff())
  )
  with check (
    public.auth_papel() = 'staff'
    and turma_id in (select public.auth_turmas_staff())
    and (
      foto_caminho is null
      or foto_caminho = escola_id::text || '/' || id::text || '/' || split_part(foto_caminho, '/', 3)
    )
  );


-- =====================================================================
-- 5. Buckets de Storage sem limite de tamanho/tipo de ficheiro
-- =====================================================================
-- `accept="image/*"` no formulário é só uma ajuda de interface — não
-- impede o envio de outro tipo de ficheiro. O Supabase Storage suporta
-- impor isto diretamente no bucket, o que é mais forte do que validar
-- no browser.

update storage.buckets
set file_size_limit = 5 * 1024 * 1024, -- 5 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('fotos-turmas', 'avatares-criancas');

update storage.buckets
set file_size_limit = 10 * 1024 * 1024, -- 10 MB
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
where id = 'documentos-criancas';
