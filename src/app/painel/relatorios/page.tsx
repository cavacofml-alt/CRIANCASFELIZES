import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesPorTipo } from "@/lib/notificacoes";
import { hojeISO, formatarDataPT, formatarDataExtensaPT } from "@/lib/data";
import { BotaoSair } from "../botao-sair";
import { PainelNav } from "../nav";
import { PageFade, StaggerList, StaggerItem } from "../motion";
import { ResumoTile } from "../resumo-tile";
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
        .from("relatorios_diarios")
        .select(
          "id, crianca_id, data, pequeno_almoco, almoco, lanche, sono_inicio, sono_fim, fraldas_trocadas, notas",
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
                Relatórios diários
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
            <StaggerList className="flex flex-col gap-4">
              {historico && historico.length > 0 ? (
                historico.map((r) => (
                  <StaggerItem
                    key={r.id}
                    className="rounded-2xl border border-brand-border bg-brand-surface p-5 dark:border-brand-border-dark dark:bg-brand-surface-dark"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-brand-ink dark:text-brand-ink-dark">
                        {nomeCrianca.get(r.crianca_id) ?? "—"}
                      </h2>
                      <span className="text-sm text-brand-muted dark:text-brand-muted-dark">
                        {formatarDataPT(r.data)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                      <ResumoTile
                        tipo="meal"
                        emoji="🥣"
                        rotulo="P. almoço"
                        valor={resumoRefeicao(r.pequeno_almoco)}
                      />
                      <ResumoTile
                        tipo="meal"
                        emoji="🍎"
                        rotulo="Almoço"
                        valor={resumoRefeicao(r.almoco)}
                      />
                      <ResumoTile
                        tipo="meal"
                        emoji="🍪"
                        rotulo="Lanche"
                        valor={resumoRefeicao(r.lanche)}
                      />
                      <ResumoTile
                        tipo="sleep"
                        emoji="😴"
                        rotulo="Sesta"
                        valor={
                          r.sono_inicio
                            ? `${r.sono_inicio.slice(0, 5)}${r.sono_fim ? `–${r.sono_fim.slice(0, 5)}` : ""}`
                            : "—"
                        }
                      />
                      <ResumoTile
                        tipo="diaper"
                        emoji="🧷"
                        rotulo="Fraldas"
                        valor={`${r.fraldas_trocadas}×`}
                      />
                    </div>
                    {r.notas && (
                      <p className="mt-2 text-sm italic text-brand-muted dark:text-brand-muted-dark">
                        “{r.notas}”
                      </p>
                    )}
                  </StaggerItem>
                ))
              ) : (
                <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
                  Ainda não há relatórios diários.
                </p>
              )}
            </StaggerList>
          </PageFade>
        </div>
      </main>
    );
  }

  // Admin e staff: preencher/editar o relatório de hoje.
  const hoje = hojeISO();

  const [{ data: turmas }, { data: criancas }, { data: relatoriosHoje }] =
    await Promise.all([
      supabase.from("turmas").select("id, nome").order("nome"),
      supabase.from("criancas").select("id, nome, turma_id").order("nome"),
      supabase
        .from("relatorios_diarios")
        .select(
          "id, crianca_id, pequeno_almoco, almoco, lanche, sono_inicio, sono_fim, fraldas_trocadas, notas",
        )
        .eq("data", hoje),
    ]);

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
    <main className="min-h-screen bg-brand-bg px-4 py-10 dark:bg-brand-bg-dark">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-dark">
              Relatórios diários
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
              grupos.map((g) => (
                <StaggerItem
                  key={g.id}
                  className="rounded-2xl border border-brand-border bg-brand-surface p-5 dark:border-brand-border-dark dark:bg-brand-surface-dark"
                >
                  <h2 className="mb-3 font-semibold text-brand-ink dark:text-brand-ink-dark">
                    {g.nome}
                  </h2>
                  <ul className="flex flex-col divide-y divide-brand-border dark:divide-brand-border-dark">
                    {g.criancas.map((c) => (
                      <li key={c.id} className="flex flex-col gap-2 py-3">
                        <span className="text-brand-ink dark:text-brand-ink-dark">
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
                </StaggerItem>
              ))
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
