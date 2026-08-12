import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesPorTipo } from "@/lib/notificacoes";
import { hojeISO } from "@/lib/data";
import { BotaoSair } from "../../botao-sair";
import { PainelNav } from "../../nav";
import { PageFade } from "../../motion";
import { RegistoRapido } from "./registo-rapido";

export default async function RegistarCriancaPage({
  params,
}: {
  params: Promise<{ criancaId: string }>;
}) {
  const { criancaId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("id, nome, papel, escola_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!perfil) redirect("/painel");
  if (perfil.papel === "encarregado") redirect("/painel");

  const { data: crianca } = await supabase
    .from("criancas")
    .select("id, nome, turma_id")
    .eq("id", criancaId)
    .maybeSingle();
  if (!crianca) notFound();

  const hoje = hojeISO();

  const { data: relatorio } = await supabase
    .from("relatorios_diarios")
    .select(
      "id, pequeno_almoco, almoco, lanche, sono_inicio, sono_fim, fraldas_trocadas, notas",
    )
    .eq("crianca_id", criancaId)
    .eq("data", hoje)
    .maybeSingle();

  const { avisos: contagemAvisos, mensagens: contagemMensagens } =
    await contarNotificacoesPorTipo();

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 dark:bg-brand-bg-dark">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <Link
              href="/painel/registar"
              className="text-sm text-brand-muted transition-colors hover:text-brand-accent dark:text-brand-muted-dark"
            >
              ‹ Voltar à turma
            </Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-dark">
              {crianca.nome}
            </h1>
          </div>
          <BotaoSair />
        </header>

        <PainelNav
          papel={perfil.papel}
          contagemAvisos={contagemAvisos}
          contagemMensagens={contagemMensagens}
        />

        <PageFade>
          <RegistoRapido
            escolaId={perfil.escola_id}
            criancaId={crianca.id}
            turmaId={crianca.turma_id}
            data={hoje}
            perfilId={perfil.id}
            relatorio={relatorio ?? null}
          />
        </PageFade>
      </div>
    </main>
  );
}
