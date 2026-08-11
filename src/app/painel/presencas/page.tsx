import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesNaoLidas } from "@/lib/notificacoes";
import { hojeISO } from "@/lib/data";
import { BotaoSair } from "../botao-sair";
import { PainelNav } from "../nav";
import { RegistoPresenca } from "./registo-presenca";

function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PresencasPage() {
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

  const contagemNaoLidas = await contarNotificacoesNaoLidas();

  if (perfil.papel === "encarregado") {
    const { data: historico } = await supabase
      .from("presencas")
      .select(
        "id, crianca_id, data, hora_entrada, hora_saida, levantado_por_nome",
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
                Presenças
              </h1>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                {perfil.nome}
              </p>
            </div>
            <BotaoSair />
          </header>

          <PainelNav contagemNaoLidas={contagemNaoLidas} />

          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            {historico && historico.length > 0 ? (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {historico.map((p) => (
                  <li key={p.id} className="flex flex-col gap-1 py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {nomeCrianca.get(p.crianca_id) ?? "—"}
                      </span>
                      <span className="text-sm text-zinc-500">
                        {new Date(p.data).toLocaleDateString("pt-PT")}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {p.hora_entrada
                        ? `Entrada ${formatarHora(p.hora_entrada)}`
                        : "Sem entrada registada"}
                      {p.hora_saida
                        ? ` · Saída ${formatarHora(p.hora_saida)} · levantado por ${p.levantado_por_nome}`
                        : " · ainda não saiu"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">
                Ainda não há registos de presença.
              </p>
            )}
          </section>
        </div>
      </main>
    );
  }

  // Admin e staff: registar entradas/saídas de hoje.
  const hoje = hojeISO();

  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome")
    .order("nome");

  const { data: criancas } = await supabase
    .from("criancas")
    .select("id, nome, turma_id")
    .order("nome");

  const { data: presencasHoje } = await supabase
    .from("presencas")
    .select("id, crianca_id, hora_entrada, hora_saida, levantado_por_nome")
    .eq("data", hoje);

  const presencaPorCrianca = new Map(
    (presencasHoje ?? []).map((p) => [p.crianca_id, p]),
  );

  const { data: ligacoes } = await supabase
    .from("encarregados_criancas")
    .select("crianca_id, encarregado_id");

  const { data: encarregadosPerfis } = await supabase
    .from("perfis")
    .select("id, nome")
    .eq("papel", "encarregado");

  const nomeEncarregado = new Map(
    (encarregadosPerfis ?? []).map((e) => [e.id, e.nome]),
  );

  const encarregadosPorCrianca = new Map<string, { id: string; nome: string }[]>();
  for (const l of ligacoes ?? []) {
    const nome = nomeEncarregado.get(l.encarregado_id);
    if (!nome) continue;
    const lista = encarregadosPorCrianca.get(l.crianca_id) ?? [];
    lista.push({ id: l.encarregado_id, nome });
    encarregadosPorCrianca.set(l.crianca_id, lista);
  }

  const grupos = [
    ...(turmas ?? []).map((t) => ({
      id: t.id,
      nome: t.nome,
      criancas: (criancas ?? []).filter((c) => c.turma_id === t.id),
    })),
    {
      id: "sem-turma",
      nome: "Sem turma atribuída",
      criancas: (criancas ?? []).filter((c) => !c.turma_id),
    },
  ].filter((g) => g.criancas.length > 0);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50">
              Presenças
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {perfil.nome} ·{" "}
              {new Date(hoje).toLocaleDateString("pt-PT", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <BotaoSair />
        </header>

        <PainelNav contagemNaoLidas={contagemNaoLidas} />

        {grupos.length > 0 ? (
          grupos.map((g) => (
            <section
              key={g.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="mb-3 font-semibold text-black dark:text-zinc-50">
                {g.nome}
              </h2>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {g.criancas.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {c.nome}
                    </span>
                    <RegistoPresenca
                      escolaId={perfil.escola_id}
                      criancaId={c.id}
                      data={hoje}
                      perfilId={perfil.id}
                      presenca={presencaPorCrianca.get(c.id) ?? null}
                      encarregados={encarregadosPorCrianca.get(c.id) ?? []}
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
