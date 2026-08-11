import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BotaoSair } from "./botao-sair";

const ETIQUETA_PAPEL: Record<string, string> = {
  admin: "Administração",
  staff: "Educador(a)",
  encarregado: "Encarregado(a) de educação",
};

export default async function PainelPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Todas as consultas abaixo passam pelo RLS: o que aparece é
  // exatamente aquilo a que este utilizador tem direito.
  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, papel, escola_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4 text-center dark:bg-black">
        <h1 className="text-2xl font-bold text-black dark:text-zinc-50">
          Conta sem perfil atribuído
        </h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          A sua conta existe mas ainda não foi associada a uma escola. Contacte
          a administração. Até lá, não tem acesso a qualquer dado.
        </p>
        <BotaoSair />
      </main>
    );
  }

  const { data: escola } = await supabase
    .from("escolas")
    .select("nome")
    .maybeSingle();

  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome")
    .order("nome");

  const { data: criancas } = await supabase
    .from("criancas")
    .select("id, nome, data_nascimento, turma_id")
    .order("nome");

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50">
              {escola?.nome ?? "Escola"}
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {perfil.nome} · {ETIQUETA_PAPEL[perfil.papel] ?? perfil.papel}
            </p>
          </div>
          <BotaoSair />
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold text-black dark:text-zinc-50">
            Turmas visíveis para si ({turmas?.length ?? 0})
          </h2>
          {turmas && turmas.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {turmas.map((t) => (
                <li
                  key={t.id}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {t.nome}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Nenhuma turma visível.</p>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold text-black dark:text-zinc-50">
            Crianças visíveis para si ({criancas?.length ?? 0})
          </h2>
          {criancas && criancas.length > 0 ? (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {criancas.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {c.nome}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {turmas?.find((t) => t.id === c.turma_id)?.nome ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Nenhuma criança visível.</p>
          )}
        </section>

        <p className="text-center text-xs text-zinc-400">
          Etapa 2 — dados fictícios. Esta lista é filtrada pela base de dados
          (RLS), não pela aplicação.
        </p>
      </div>
    </main>
  );
}
