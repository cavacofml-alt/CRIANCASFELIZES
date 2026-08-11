import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesPorTipo } from "@/lib/notificacoes";
import { formatarDataHoraPT } from "@/lib/data";
import { BotaoSair } from "../botao-sair";
import { PainelNav } from "../nav";
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
  // política de `avisos` autorizar este utilizador a vê-lo.
  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome")
    .order("nome");

  const { data: avisos } = await supabase
    .from("avisos")
    .select("id, titulo, corpo, turma_id, autor_id, criado_em")
    .order("criado_em", { ascending: false });

  const { data: autores } = await supabase.from("perfis").select("id, nome");

  const nomeAutor = new Map((autores ?? []).map((a) => [a.id, a.nome]));
  const nomeTurma = new Map((turmas ?? []).map((t) => [t.id, t.nome]));

  // Visitar o mural é o que "lê" as notificações de avisos.
  await supabase.rpc("marcar_notificacoes_tipo_lidas", { tipo_param: "aviso" });

  const { avisos: contagemAvisos, mensagens: contagemMensagens } =
    await contarNotificacoesPorTipo();
  const podePublicar = perfil.papel === "admin" || perfil.papel === "staff";

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50">
              Mural de avisos
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {perfil.nome}
            </p>
          </div>
          <BotaoSair />
        </header>

        <PainelNav contagemAvisos={contagemAvisos} contagemMensagens={contagemMensagens} />

        {podePublicar && (
          <NovoAvisoForm
            perfilId={perfil.id}
            escolaId={perfil.escola_id}
            papel={perfil.papel}
            turmas={turmas ?? []}
          />
        )}

        <section className="flex flex-col gap-4">
          {avisos && avisos.length > 0 ? (
            avisos.map((a) => (
              <article
                key={a.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-black dark:text-zinc-50">
                    {a.titulo}
                  </h2>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {a.turma_id
                      ? (nomeTurma.get(a.turma_id) ?? "Turma")
                      : "Toda a escola"}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                  {a.corpo}
                </p>
                <p className="mt-3 text-xs text-zinc-400">
                  {nomeAutor.get(a.autor_id) ?? "—"} ·{" "}
                  {formatarDataHoraPT(a.criado_em)}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-500">Ainda não há avisos.</p>
          )}
        </section>
      </div>
    </main>
  );
}
