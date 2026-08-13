-- =====================================================================
-- Etapa 7b (continuação) — a correção de 0024 tapou a tabela `fotos`,
-- mas não o Storage
-- =====================================================================
-- 0024 restringiu `fotos_select_encarregado` para exigir uma marcação
-- em `foto_criancas`. Mas a política do bucket `fotos-turmas`
-- continuava a autorizar por turma (`storage.foldername`), porque o
-- caminho do ficheiro nunca incluiu o `crianca_id` — só
-- `<escola_id>/<turma_id>/<ficheiro>`.
--
-- Isto deixava uma via secundária aberta: mesmo sem aparecer na
-- listagem de fotos, um encarregado tecnicamente conseguia gerar um
-- link assinado para QUALQUER ficheiro da turma do seu educando, só
-- por adivinhar/conhecer o nome do ficheiro — porque o Storage não
-- verificava a marcação por criança, só a pasta.
--
-- Correção: para encarregados, a leitura no Storage passa a exigir a
-- mesma prova que a tabela `fotos` já exige — uma linha em
-- `foto_criancas` a ligar aquele ficheiro exato a um dos seus
-- educandos. Admin e staff mantêm o acesso por turma (fazem a gestão
-- da turma toda, não é um problema de privacidade entre famílias).
-- =====================================================================

drop policy if exists "fotos_turmas_storage_select" on storage.objects;
create policy "fotos_turmas_storage_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'fotos-turmas'
    and (storage.foldername(name))[1] = public.auth_escola_id()::text
    and (
      public.auth_papel() = 'admin'
      or (
        public.auth_papel() = 'staff'
        and (storage.foldername(name))[2]::uuid in (select public.auth_turmas_staff())
      )
      or (
        public.auth_papel() = 'encarregado'
        and (storage.foldername(name))[2]::uuid in (select public.auth_turmas_encarregado())
        and exists (
          select 1
          from public.fotos f
          join public.foto_criancas fc on fc.foto_id = f.id
          where f.caminho = name
            and fc.crianca_id in (select public.auth_criancas_encarregado())
        )
      )
    )
  );
