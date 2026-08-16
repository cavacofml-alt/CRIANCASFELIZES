import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesPorTipo } from "@/lib/notificacoes";
import {
  hojeISO,
  formatarHoraPT,
  formatarDataPT,
  formatarDataExtensaPT,
} from "@/lib/data";
import { assinarAvatares } from "@/lib/avatares";
import { BotaoSair } from "../botao-sair";
import { PainelNav } from "../nav";
import { PageFade, StaggerList, StaggerItem } from "../motion";
import { Avatar } from "../avatar";
import { RegistoPresenca } from "./registo-presenca";

export default async function PresencasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: perfil }, notificacoes] = await Promise.all([
    supabase
      .from("perfis")
      .select("id, nome, papel, escola_id")
      .eq("id", user.id)
      .maybeSingle(),
    contarNotificacoesPorTipo(),
  ]);
  if (!perfil) redirect("/painel");
  const { avisos: contagemAvisos, mensagens: contagemMensagens } = notificacoes;

  if (perfil.papel === "encarregado") {
    const [{ data: historico }, { data: criancas }] = await Promise.all([
      supabase
        .from("presencas")
        .select(
          "id, crianca_id, data, hora_entrada, hora_saida, levantado_por_nome",
        )
        .order("data", { ascending: false })
        .limit(14),
      supabase.from("criancas").select("id, nome"),
    ]);
    const nomeCrianca = new Map((criancas ?? []).map((c) => [c.id, c.nome]));

    return (
      <main className="min-h-screen bg-brand-bg px-4 py-10 dark:bg-brand-bg-dark">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-dark">
                Presenças
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

          <PageFade>
            <section className="rounded-2xl border border-brand-border bg-brand-surface p-5 dark:border-brand-border-dark dark:bg-brand-surface-dark">
              {historico && historico.length > 0 ? (
                <StaggerList className="divide-y divide-brand-border dark:divide-brand-border-dark">
                  {historico.map((p) => (
                    <StaggerItem key={p.id} className="flex flex-col gap-1 py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-brand-ink dark:text-brand-ink-dark">
                          {nomeCrianca.get(p.crianca_id) ?? "—"}
                        </span>
                        <span className="text-sm text-brand-muted dark:text-brand-muted-dark">
                          {formatarDataPT(p.data)}
                        </span>
                      </div>
                      <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
                        {p.hora_entrada
                          ? `Entrada ${formatarHoraPT(p.hora_entrada)}`
                          : "Sem entrada registada"}
                        {p.hora_saida
                          ? ` · Saída ${formatarHoraPT(p.hora_saida)} · levantado por ${p.levantado_por_nome}`
                          : " · ainda não saiu"}
                      </p>
                    </StaggerItem>
                  ))}
                </StaggerList>
              ) : (
                <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
                  Ainda não há registos de presença.
                </p>
              )}
            </section>
          </PageFade>
        </div>
      </main>
    );
  }

  // Admin e staff: registar entradas/saídas de hoje.
  const hoje = hojeISO();

  const [
    { data: turmas },
    { data: criancas },
    { data: presencasHoje },
    { data: ligacoes },
    { data: encarregadosPerfis },
  ] = await Promise.all([
    supabase.from("turmas").select("id, nome").order("nome"),
    supabase
      .from("criancas")
      .select("id, nome, turma_id, foto_caminho")
      .order("nome"),
    supabase
      .from("presencas")
      .select("id, crianca_id, hora_entrada, hora_saida, levantado_por_nome")
      .eq("data", hoje),
    supabase.from("encarregados_criancas").select("crianca_id, encarregado_id"),
    supabase.from("perfis").select("id, nome").eq("papel", "encarregado"),
  ]);

  const avatares = await assinarAvatares(
    supabase,
    (criancas ?? []).map((c) => c.foto_caminho),
  );

  const presencaPorCrianca = new Map(
    (presencasHoje ?? []).map((p) => [p.crianca_id, p]),
  );

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
    <main className="min-h-screen bg-brand-bg px-4 py-10 dark:bg-brand-bg-dark">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-dark">
              Presenças
            </h1>
            <p className="mt-1 text-brand-muted dark:text-brand-muted-dark">
              {perfil.nome} · {formatarDataExtensaPT(hoje)}
            </p>
          </div>
          <BotaoSair />
        </header>

        <PainelNav
          papel={perfil.papel}
          contagemAvisos={contagemAvisos}
          contagemMensagens={contagemMensagens}
        />

        <PageFade>
          <StaggerList className="flex flex-col gap-6">
            {grupos.length > 0 ? (
              grupos.map((g) => {
                const presentes = g.criancas.filter((c) => {
                  const p = presencaPorCrianca.get(c.id);
                  return p?.hora_entrada && !p.hora_saida;
                }).length;
                const porChegar = g.criancas.filter(
                  (c) => !presencaPorCrianca.get(c.id)?.hora_entrada,
                ).length;

                return (
                  <StaggerItem
                    key={g.id}
                    className="rounded-2xl border border-brand-border bg-brand-surface p-5 dark:border-brand-border-dark dark:bg-brand-surface-dark"
                  >
                    <h2 className="mb-3 font-semibold text-brand-ink dark:text-brand-ink-dark">
                      {g.nome}
                    </h2>
                    <div className="mb-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-brand-positive-soft p-3 text-center dark:bg-brand-positive-soft-dark">
                        <p className="text-lg font-bold text-brand-positive">
                          {presentes}
                        </p>
                        <p className="text-[11px] font-medium text-brand-positive">
                          Presentes
                        </p>
                      </div>
                      <div className="rounded-xl bg-brand-warn-soft p-3 text-center dark:bg-brand-warn-soft-dark">
                        <p className="text-lg font-bold text-brand-warn">
                          {porChegar}
                        </p>
                        <p className="text-[11px] font-medium text-brand-warn">
                          Por chegar
                        </p>
                      </div>
                      <div className="rounded-xl border border-brand-border p-3 text-center dark:border-brand-border-dark">
                        <p className="text-lg font-bold text-brand-ink dark:text-brand-ink-dark">
                          {g.criancas.length}
                        </p>
                        <p className="text-[11px] font-medium text-brand-muted dark:text-brand-muted-dark">
                          Total
                        </p>
                      </div>
                    </div>
                    <ul className="divide-y divide-brand-border dark:divide-brand-border-dark">
                    {g.criancas.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <span className="flex items-center gap-3 text-brand-ink dark:text-brand-ink-dark">
                          <Avatar
                            nome={c.nome}
                            src={c.foto_caminho ? avatares.get(c.foto_caminho) : null}
                            tamanho="sm"
                          />
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
                  </StaggerItem>
                );
              })
            ) : (
              <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
                Nenhuma criança visível.
              </p>
            )}
          </StaggerList>
        </PageFade>
      </div>
    </main>
  );
}
