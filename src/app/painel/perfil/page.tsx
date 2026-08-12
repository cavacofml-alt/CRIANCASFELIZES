import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesPorTipo } from "@/lib/notificacoes";
import { formatarDataPT } from "@/lib/data";
import { corTurma, indicePorTurma } from "@/lib/turmas";
import { BotaoSair } from "../botao-sair";
import { PainelNav } from "../nav";
import { PageFade, StaggerList, StaggerItem } from "../motion";

export default async function PerfilPage() {
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

  // Esta página é pensada para a família — para a equipa, a gestão de
  // crianças continua a fazer-se por fora da app, por agora.
  if (perfil.papel !== "encarregado") redirect("/painel");

  const { avisos: contagemAvisos, mensagens: contagemMensagens } =
    await contarNotificacoesPorTipo();

  const { data: criancas } = await supabase
    .from("criancas")
    .select("id, nome, data_nascimento, turma_id")
    .order("nome");

  const { data: turmas } = await supabase.from("turmas").select("id, nome");
  const nomeTurma = new Map((turmas ?? []).map((t) => [t.id, t.nome]));
  const indiceTurma = indicePorTurma(turmas ?? []);

  const { data: ligacoes } = await supabase
    .from("encarregados_criancas")
    .select("crianca_id, encarregado_id, parentesco");

  const { data: perfisEncarregados } = await supabase
    .from("perfis")
    .select("id, nome")
    .eq("papel", "encarregado");
  const nomeEncarregado = new Map(
    (perfisEncarregados ?? []).map((p) => [p.id, p.nome]),
  );

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 dark:bg-brand-bg-dark">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-dark">
              Perfil
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
            {criancas && criancas.length > 0 ? (
              criancas.map((c) => {
                const cor = c.turma_id != null ? corTurma(indiceTurma.get(c.turma_id) ?? 0) : null;
                const outros = (ligacoes ?? [])
                  .filter((l) => l.crianca_id === c.id && l.encarregado_id !== perfil.id)
                  .map((l) => ({
                    nome: nomeEncarregado.get(l.encarregado_id) ?? "—",
                    parentesco: l.parentesco,
                  }));

                return (
                  <StaggerItem
                    key={c.id}
                    className="rounded-2xl border border-brand-border bg-brand-surface p-5 dark:border-brand-border-dark dark:bg-brand-surface-dark"
                  >
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-brand-ink dark:text-brand-ink-dark">
                        {c.nome}
                      </h2>
                      {c.turma_id != null && cor && (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cor.bg} ${cor.texto}`}
                        >
                          {nomeTurma.get(c.turma_id) ?? "—"}
                        </span>
                      )}
                    </div>

                    <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs text-brand-muted dark:text-brand-muted-dark">
                          Data de nascimento
                        </dt>
                        <dd className="text-sm text-brand-ink dark:text-brand-ink-dark">
                          {c.data_nascimento ? formatarDataPT(c.data_nascimento) : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-brand-muted dark:text-brand-muted-dark">
                          Outros encarregados de educação
                        </dt>
                        <dd className="text-sm text-brand-ink dark:text-brand-ink-dark">
                          {outros.length > 0
                            ? outros.map((o) => `${o.nome} (${o.parentesco})`).join(", ")
                            : "—"}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 rounded-xl border border-brand-border p-3 text-xs text-brand-muted dark:border-brand-border-dark dark:text-brand-muted-dark">
                      Alergias, autorizações de quem pode levantar a criança e
                      documentos vão ficar disponíveis aqui numa fase
                      seguinte. Por agora, esses dados continuam a ser
                      tratados diretamente com a escola.
                    </div>
                  </StaggerItem>
                );
              })
            ) : (
              <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
                Ainda não há nenhuma criança associada à sua conta.
              </p>
            )}
          </StaggerList>
        </PageFade>
      </div>
    </main>
  );
}
