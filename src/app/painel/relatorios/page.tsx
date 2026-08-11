import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesPorTipo } from "@/lib/notificacoes";
import { hojeISO, formatarDataPT, formatarDataExtensaPT } from "@/lib/data";
import { BotaoSair } from "../botao-sair";
import { PainelNav } from "../nav";
import { RegistoRelatorio } from "./registo-relatorio";

const ETIQUETA_REFEICAO: Record<string, string> = {
  nao_comeu: "Não comeu",
  comeu_pouco: "Comeu pouco",
  comeu_metade: "Comeu metade",
  comeu_tudo: "Comeu tudo",
};

function resumoRefeicao(valor: string | null) {
  return valor ? ETIQUETA_REFEICAO[valor] : "—";
}

export default async function RelatoriosPage() {
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

  const { avisos: contagemAvisos, mensagens: contagemMensagens } =
    await contarNotificacoesPorTipo();

  if (perfil.papel === "encarregado") {
    const { data: historico } = await supabase
      .from("relatorios_diarios")
      .select(
        "id, crianca_id, data, pequeno_almoco, almoco, lanche, sono_inicio, sono_fim, fraldas_trocadas, notas",
      )
      .order("data", { ascending: false })
      .limit(14);

    const { data: criancas } = await supabase
      .from("criancas")
      .select("id, nome");
    const nomeCrianca = new Map((criancas ?? []).map((c) => [c.id, c.nome]));

    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-black">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50">
                Relatórios diários
              </h1>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                {perfil.nome}
              </p>
            </div>
            <BotaoSair />
          </header>

          <PainelNav
            contagemAvisos={contagemAvisos}
            contagemMensagens={contagemMensagens}
          />

          <section className="flex flex-col gap-4">
            {historico && historico.length > 0 ? (
              historico.map((r) => (
                <article
                  key={r.id}
                  className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-black dark:text-zinc-50">
                      {nomeCrianca.get(r.crianca_id) ?? "—"}
                    </h2>
                    <span className="text-sm text-zinc-500">
                      {formatarDataPT(r.data)}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-zinc-500">Pequeno-almoço</dt>
                      <dd className="text-zinc-800 dark:text-zinc-200">
                        {resumoRefeicao(r.pequeno_almoco)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Almoço</dt>
                      <dd className="text-zinc-800 dark:text-zinc-200">
                        {resumoRefeicao(r.almoco)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Lanche</dt>
                      <dd className="text-zinc-800 dark:text-zinc-200">
                        {resumoRefeicao(r.lanche)}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {r.sono_inicio
                      ? `Sesta: ${r.sono_inicio.slice(0, 5)}${r.sono_fim ? ` – ${r.sono_fim.slice(0, 5)}` : ""}`
                      : "Sem registo de sesta"}
                    {" · "}
                    Fraldas trocadas: {r.fraldas_trocadas}
                  </p>
                  {r.notas && (
                    <p className="mt-2 text-sm italic text-zinc-600 dark:text-zinc-400">
                      “{r.notas}”
                    </p>
                  )}
                </article>
              ))
            ) : (
              <p className="text-sm text-zinc-500">
                Ainda não há relatórios diários.
              </p>
            )}
          </section>
        </div>
      </main>
    );
  }

  // Admin e staff: preencher/editar o relatório de hoje.
  const hoje = hojeISO();

  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome")
    .order("nome");

  const { data: criancas } = await supabase
    .from("criancas")
    .select("id, nome, turma_id")
    .order("nome");

  const { data: relatoriosHoje } = await supabase
    .from("relatorios_diarios")
    .select(
      "id, crianca_id, pequeno_almoco, almoco, lanche, sono_inicio, sono_fim, fraldas_trocadas, notas",
    )
    .eq("data", hoje);

  const relatorioPorCrianca = new Map(
    (relatoriosHoje ?? []).map((r) => [r.crianca_id, r]),
  );

  const grupos = (turmas ?? [])
    .map((t) => ({
      id: t.id,
      nome: t.nome,
      criancas: (criancas ?? []).filter((c) => c.turma_id === t.id),
    }))
    .filter((g) => g.criancas.length > 0);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50">
              Relatórios diários
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {perfil.nome} · {formatarDataExtensaPT(hoje)}
            </p>
          </div>
          <BotaoSair />
        </header>

        <PainelNav
          contagemAvisos={contagemAvisos}
          contagemMensagens={contagemMensagens}
        />

        {grupos.length > 0 ? (
          grupos.map((g) => (
            <section
              key={g.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="mb-3 font-semibold text-black dark:text-zinc-50">
                {g.nome}
              </h2>
              <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                {g.criancas.map((c) => (
                  <li key={c.id} className="flex flex-col gap-2 py-3">
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {c.nome}
                    </span>
                    <RegistoRelatorio
                      escolaId={perfil.escola_id}
                      criancaId={c.id}
                      data={hoje}
                      perfilId={perfil.id}
                      relatorio={relatorioPorCrianca.get(c.id) ?? null}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))
        ) : (
          <p className="text-sm text-zinc-500">Nenhuma criança visível.</p>
        )}
      </div>
    </main>
  );
}
