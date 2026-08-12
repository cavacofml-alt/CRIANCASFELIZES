import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesPorTipo } from "@/lib/notificacoes";
import { hojeISO } from "@/lib/data";
import { BotaoSair } from "../botao-sair";
import { PainelNav } from "../nav";
import { PageFade, StaggerList, StaggerItem } from "../motion";

export default async function RegistarPage() {
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

  // O registo rápido é uma ferramenta de trabalho da equipa — famílias
  // continuam a consultar (sem escrever) através de "Hoje".
  if (perfil.papel === "encarregado") redirect("/painel");

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
    .select("crianca_id, hora_entrada, hora_saida")
    .eq("data", hoje);
  const presencaPorCrianca = new Map(
    (presencasHoje ?? []).map((p) => [p.crianca_id, p]),
  );

  const { avisos: contagemAvisos, mensagens: contagemMensagens } =
    await contarNotificacoesPorTipo();

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
              Registar
            </h1>
            <p className="mt-1 text-brand-muted dark:text-brand-muted-dark">
              Toque numa criança para registar refeição, sesta, higiene, foto
              ou uma observação — em um ou dois toques.
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
                    {g.criancas.map((c) => {
                      const presenca = presencaPorCrianca.get(c.id);
                      const presente = !!presenca?.hora_entrada && !presenca?.hora_saida;
                      return (
                        <li key={c.id}>
                          <Link
                            href={`/painel/registar/${c.id}`}
                            className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-brand-accent"
                          >
                            <span className="flex items-center gap-2 text-brand-ink dark:text-brand-ink-dark">
                              <span
                                aria-hidden="true"
                                className={`h-2 w-2 rounded-full ${
                                  presente ? "bg-brand-positive" : "bg-brand-border dark:bg-brand-border-dark"
                                }`}
                              />
                              {c.nome}
                            </span>
                            <span className="text-brand-muted dark:text-brand-muted-dark">›</span>
                          </Link>
                        </li>
                      );
                    })}
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
