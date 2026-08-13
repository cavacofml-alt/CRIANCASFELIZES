import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesPorTipo } from "@/lib/notificacoes";
import { formatarDataPT } from "@/lib/data";
import { corTurma, indicePorTurma } from "@/lib/turmas";
import { assinarAvatares } from "@/lib/avatares";
import { BotaoSair } from "../botao-sair";
import { PainelNav } from "../nav";
import { PageFade, StaggerList, StaggerItem } from "../motion";
import { Avatar } from "../avatar";
import { AutorizacoesRecolha } from "./autorizacao-form";
import { DocumentosCrianca } from "./documento-form";
import { TabsCrianca } from "./tabs-crianca";

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
    .select("id, nome, data_nascimento, turma_id, alergias, notas_saude, foto_caminho")
    .order("nome");

  const criancaIds = (criancas ?? []).map((c) => c.id);

  const avatares = await assinarAvatares(
    supabase,
    (criancas ?? []).map((c) => c.foto_caminho),
  );

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

  const { data: autorizacoes } =
    criancaIds.length > 0
      ? await supabase
          .from("autorizacoes_recolha")
          .select("id, crianca_id, nome, parentesco, telefone")
          .in("crianca_id", criancaIds)
          .order("nome")
      : { data: [] };

  const { data: documentos } =
    criancaIds.length > 0
      ? await supabase
          .from("documentos_crianca")
          .select("id, crianca_id, caminho, nome_ficheiro, criado_em")
          .in("crianca_id", criancaIds)
          .order("criado_em", { ascending: false })
      : { data: [] };

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
                const autorizacoesDaCrianca = (autorizacoes ?? []).filter(
                  (a) => a.crianca_id === c.id,
                );
                const documentosDaCrianca = (documentos ?? []).filter(
                  (d) => d.crianca_id === c.id,
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
                        tamanho="lg"
                      />
                      <div>
                        <h2 className="text-lg font-semibold text-brand-ink dark:text-brand-ink-dark">
                          {c.nome}
                        </h2>
                        {c.turma_id != null && cor && (
                          <span
                            className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cor.bg} ${cor.texto}`}
                          >
                            {nomeTurma.get(c.turma_id) ?? "—"}
                          </span>
                        )}
                      </div>
                    </div>

                    <TabsCrianca
                      informacoes={
                        <div className="flex flex-col gap-4">
                          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                                Turma
                              </dt>
                              <dd className="text-sm text-brand-ink dark:text-brand-ink-dark">
                                {c.turma_id != null ? nomeTurma.get(c.turma_id) ?? "—" : "—"}
                              </dd>
                            </div>
                          </dl>
                          <div className="border-t border-brand-border pt-4 dark:border-brand-border-dark">
                            <h3 className="mb-2 text-sm font-semibold text-brand-ink dark:text-brand-ink-dark">
                              Desenvolvimento
                            </h3>
                            <Link
                              href="/painel/desenvolvimento"
                              className="text-sm font-medium text-brand-accent hover:underline"
                            >
                              Ver marcos de desenvolvimento →
                            </Link>
                          </div>
                        </div>
                      }
                      saude={
                        <div className="flex flex-col gap-4">
                          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <dt className="text-xs text-brand-muted dark:text-brand-muted-dark">
                                Alergias
                              </dt>
                              <dd className="text-sm text-brand-ink dark:text-brand-ink-dark">
                                {c.alergias || "—"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-brand-muted dark:text-brand-muted-dark">
                                Notas de saúde
                              </dt>
                              <dd className="text-sm text-brand-ink dark:text-brand-ink-dark">
                                {c.notas_saude || "—"}
                              </dd>
                            </div>
                          </dl>
                          <p className="text-xs italic text-brand-muted dark:text-brand-muted-dark">
                            Alergias e notas de saúde são geridas pela direção
                            da escola — contacte-a diretamente para atualizar.
                          </p>
                        </div>
                      }
                      responsaveis={
                        <div className="flex flex-col gap-4">
                          <div>
                            <h3 className="mb-2 text-sm font-semibold text-brand-ink dark:text-brand-ink-dark">
                              Outros encarregados de educação
                            </h3>
                            <p className="text-sm text-brand-ink dark:text-brand-ink-dark">
                              {outros.length > 0
                                ? outros.map((o) => `${o.nome} (${o.parentesco})`).join(", ")
                                : "—"}
                            </p>
                          </div>
                          <div className="border-t border-brand-border pt-4 dark:border-brand-border-dark">
                            <h3 className="mb-2 text-sm font-semibold text-brand-ink dark:text-brand-ink-dark">
                              Autorizadas a levantar a criança
                            </h3>
                            <AutorizacoesRecolha
                              escolaId={perfil.escola_id}
                              criancaId={c.id}
                              perfilId={perfil.id}
                              autorizacoes={autorizacoesDaCrianca}
                            />
                          </div>
                        </div>
                      }
                      documentos={
                        <DocumentosCrianca
                          escolaId={perfil.escola_id}
                          criancaId={c.id}
                          perfilId={perfil.id}
                          documentos={documentosDaCrianca}
                        />
                      }
                    />
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
