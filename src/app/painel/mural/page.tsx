import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesPorTipo } from "@/lib/notificacoes";
import { formatarDataHoraPT } from "@/lib/data";
import { corTurma, indicePorTurma } from "@/lib/turmas";
import { BotaoSair } from "../botao-sair";
import { PainelNav } from "../nav";
import { PageFade, StaggerList, StaggerItem } from "../motion";
import { NovoAvisoForm } from "./novo-aviso-form";

export default async function MuralPage() {
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

  // Todas as consultas abaixo passam pelo RLS: um aviso só aparece se a
  // política de `avisos` autorizar este utilizador a vê-lo. Nenhuma
  // depende das outras, por isso correm em paralelo.
  const [{ data: turmas }, { data: avisos }, { data: autores }] =
    await Promise.all([
      supabase.from("turmas").select("id, nome").order("nome"),
      supabase
        .from("avisos")
        .select("id, titulo, corpo, turma_id, autor_id, criado_em")
        .order("criado_em", { ascending: false }),
      supabase.from("perfis").select("id, nome"),
    ]);

  const nomeAutor = new Map((autores ?? []).map((a) => [a.id, a.nome]));
  const nomeTurma = new Map((turmas ?? []).map((t) => [t.id, t.nome]));
  const indiceTurma = indicePorTurma(turmas ?? []);

  // Visitar o mural é o que "lê" as notificações de avisos — tem de
  // acontecer antes de contar as notificações por ler, logo abaixo
  // (não pode ser paralelizado com isso, só com as consultas acima).
  await supabase.rpc("marcar_notificacoes_tipo_lidas", { tipo_param: "aviso" });

  const { avisos: contagemAvisos, mensagens: contagemMensagens } =
    await contarNotificacoesPorTipo();
  const podePublicar = perfil.papel === "admin" || perfil.papel === "staff";

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 dark:bg-brand-bg-dark">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-dark">
              Mural de avisos
            </h1>
            <p className="mt-1 text-brand-muted dark:text-brand-muted-dark">
              {perfil.nome}
            </p>
          </div>
          <BotaoSair />
        </header>

        <PainelNav
          papel={perfil.papel}
          contagemAvisos={contagemAvisos}
          contagemMensagens={contagemMensagens}
        />

        {podePublicar && (
          <NovoAvisoForm
            perfilId={perfil.id}
            escolaId={perfil.escola_id}
            papel={perfil.papel}
            turmas={turmas ?? []}
          />
        )}

        <PageFade>
          <StaggerList className="flex flex-col gap-4">
            {avisos && avisos.length > 0 ? (
              avisos.map((a) => {
                const cor = a.turma_id
                  ? corTurma(indiceTurma.get(a.turma_id) ?? 0)
                  : null;
                return (
                  <StaggerItem
                    key={a.id}
                    className="rounded-2xl border border-brand-border bg-brand-surface p-5 dark:border-brand-border-dark dark:bg-brand-surface-dark"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-semibold text-brand-ink dark:text-brand-ink-dark">
                        {a.titulo}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          cor
                            ? `${cor.bg} ${cor.texto}`
                            : "bg-brand-accent-soft text-brand-accent dark:bg-brand-accent-soft-dark"
                        }`}
                      >
                        {a.turma_id
                          ? (nomeTurma.get(a.turma_id) ?? "Turma")
                          : "Toda a escola"}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-brand-ink/90 dark:text-brand-ink-dark/90">
                      {a.corpo}
                    </p>
                    <p className="mt-3 text-xs text-brand-muted dark:text-brand-muted-dark">
                      {nomeAutor.get(a.autor_id) ?? "—"} ·{" "}
                      {formatarDataHoraPT(a.criado_em)}
                    </p>
                  </StaggerItem>
                );
              })
            ) : (
              <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
                Ainda não há avisos.
              </p>
            )}
          </StaggerList>
        </PageFade>
      </div>
    </main>
  );
}
