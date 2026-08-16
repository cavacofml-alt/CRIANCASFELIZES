import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesPorTipo } from "@/lib/notificacoes";
import { formatarDataPT } from "@/lib/data";
import { assinarAvatares } from "@/lib/avatares";
import { BotaoSair } from "../botao-sair";
import { PainelNav } from "../nav";
import { PageFade, StaggerList, StaggerItem } from "../motion";
import { Avatar } from "../avatar";

const ETIQUETA_CATEGORIA: Record<string, string> = {
  motor: "Motor",
  linguagem: "Linguagem",
  social: "Social",
  cognitivo: "Cognitivo",
  autonomia: "Autonomia",
};

export default async function DesenvolvimentoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("id, nome, papel")
    .eq("id", user.id)
    .maybeSingle();
  if (!perfil) redirect("/painel");
  if (perfil.papel !== "encarregado") redirect("/painel");

  const [notificacoes, { data: criancas }] = await Promise.all([
    contarNotificacoesPorTipo(),
    supabase.from("criancas").select("id, nome, foto_caminho").order("nome"),
  ]);
  const { avisos: contagemAvisos, mensagens: contagemMensagens } = notificacoes;

  const criancaIds = (criancas ?? []).map((c) => c.id);

  const [avatares, { data: marcos }] = await Promise.all([
    assinarAvatares(
      supabase,
      (criancas ?? []).map((c) => c.foto_caminho),
    ),
    criancaIds.length > 0
      ? supabase
          .from("marcos_desenvolvimento")
          .select("id, crianca_id, categoria, titulo, descricao, data")
          .in("crianca_id", criancaIds)
          .order("data", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 dark:bg-brand-bg-dark">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-dark">
              Desenvolvimento
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
                const marcosDaCrianca = (marcos ?? []).filter(
                  (m) => m.crianca_id === c.id,
                );
                return (
                  <StaggerItem
                    key={c.id}
                    className="flex flex-col gap-4 rounded-2xl border border-brand-border bg-brand-surface p-5 dark:border-brand-border-dark dark:bg-brand-surface-dark"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        nome={c.nome}
                        src={c.foto_caminho ? avatares.get(c.foto_caminho) : null}
                        tamanho="md"
                      />
                      <h2 className="text-lg font-semibold text-brand-ink dark:text-brand-ink-dark">
                        {c.nome}
                      </h2>
                    </div>

                    {marcosDaCrianca.length > 0 ? (
                      <ul className="flex flex-col divide-y divide-brand-border dark:divide-brand-border-dark">
                        {marcosDaCrianca.map((m) => (
                          <li key={m.id} className="py-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-brand-accent-soft px-2 py-0.5 text-xs font-medium text-brand-accent dark:bg-brand-accent-soft-dark">
                                {ETIQUETA_CATEGORIA[m.categoria] ?? m.categoria}
                              </span>
                              <span className="text-sm font-medium text-brand-ink dark:text-brand-ink-dark">
                                {m.titulo}
                              </span>
                              <span className="ml-auto text-xs text-brand-muted dark:text-brand-muted-dark">
                                {formatarDataPT(m.data)}
                              </span>
                            </div>
                            {m.descricao && (
                              <p className="mt-1 text-sm text-brand-muted dark:text-brand-muted-dark">
                                {m.descricao}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
                        Ainda não há marcos registados.
                      </p>
                    )}
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
