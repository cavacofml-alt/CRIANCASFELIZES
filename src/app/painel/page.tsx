import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesPorTipo } from "@/lib/notificacoes";
import { hojeISO, formatarHoraPT, formatarDataHoraPT } from "@/lib/data";
import { corTurma, indicePorTurma } from "@/lib/turmas";
import { assinarAvatares } from "@/lib/avatares";
import { BotaoSair } from "./botao-sair";
import { PainelNav } from "./nav";
import { PageFade, StaggerList, StaggerItem } from "./motion";
import { ResumoTile } from "./resumo-tile";
import { Avatar } from "./avatar";

const ETIQUETA_PAPEL: Record<string, string> = {
  admin: "Administração",
  staff: "Educador(a)",
  encarregado: "Encarregado(a) de educação",
};

const ETIQUETA_REFEICAO: Record<string, string> = {
  nao_comeu: "Não comeu",
  comeu_pouco: "Comeu pouco",
  comeu_metade: "Comeu metade",
  comeu_tudo: "Comeu tudo",
};

const UMA_HORA = 60 * 60;

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
    .select("id, nome, papel, escola_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-bg px-4 text-center dark:bg-brand-bg-dark">
        <h1 className="text-2xl font-bold text-brand-ink dark:text-brand-ink-dark">
          Conta sem perfil atribuído
        </h1>
        <p className="max-w-md text-brand-muted dark:text-brand-muted-dark">
          A sua conta existe mas ainda não foi associada a uma escola. Contacte
          a administração. Até lá, não tem acesso a qualquer dado.
        </p>
        <BotaoSair />
      </main>
    );
  }

  const [{ data: escola }, { avisos: contagemAvisos, mensagens: contagemMensagens }] =
    await Promise.all([
      supabase.from("escolas").select("nome").maybeSingle(),
      contarNotificacoesPorTipo(),
    ]);

  const cabecalho = (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-dark">
          Olá, {perfil.nome.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-brand-muted dark:text-brand-muted-dark">
          {escola?.nome ?? "Escola"} · {ETIQUETA_PAPEL[perfil.papel] ?? perfil.papel}
        </p>
      </div>
      <BotaoSair />
    </header>
  );

  const nav = (
    <PainelNav papel={perfil.papel} contagemAvisos={contagemAvisos} contagemMensagens={contagemMensagens} />
  );

  // =====================================================================
  // ENCARREGADO — resumo do dia de cada educando, fotos recentes, mensagens.
  // =====================================================================
  if (perfil.papel === "encarregado") {
    const hoje = hojeISO();

    // Os três pedidos abaixo não dependem uns dos outros — correm em
    // paralelo para poupar idas e vindas ao servidor (menos demora
    // percetível ao navegar).
    const [{ data: criancas }, { data: turmas }, { data: ultimaMensagem }] =
      await Promise.all([
        supabase
          .from("criancas")
          .select("id, nome, turma_id, foto_caminho")
          .order("nome"),
        supabase.from("turmas").select("id, nome").order("nome"),
        supabase
          .from("mensagens")
          .select("remetente_id, destinatario_id, corpo, criado_em")
          .or(`remetente_id.eq.${perfil.id},destinatario_id.eq.${perfil.id}`)
          .order("criado_em", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    const nomeTurma = new Map((turmas ?? []).map((t) => [t.id, t.nome]));
    const indiceTurma = indicePorTurma(turmas ?? []);

    const idsCriancas = (criancas ?? []).map((c) => c.id);
    const idsTurmas = [
      ...new Set((criancas ?? []).map((c) => c.turma_id).filter(Boolean)),
    ] as string[];

    const [{ data: presencasHoje }, { data: relatoriosHoje }, { data: fotos }] =
      await Promise.all([
        idsCriancas.length
          ? supabase
              .from("presencas")
              .select("crianca_id, hora_entrada, hora_saida")
              .eq("data", hoje)
              .in("crianca_id", idsCriancas)
          : Promise.resolve({ data: [] }),
        idsCriancas.length
          ? supabase
              .from("relatorios_diarios")
              .select(
                "crianca_id, pequeno_almoco, almoco, lanche, sono_inicio, sono_fim, fraldas_trocadas",
              )
              .eq("data", hoje)
              .in("crianca_id", idsCriancas)
          : Promise.resolve({ data: [] }),
        idsTurmas.length
          ? supabase
              .from("fotos")
              .select("id, turma_id, caminho, legenda, criado_em")
              .in("turma_id", idsTurmas)
              .order("criado_em", { ascending: false })
              .limit(3)
          : Promise.resolve({ data: [] }),
      ]);

    const presencaPorCrianca = new Map(
      (presencasHoje ?? []).map((p) => [p.crianca_id, p]),
    );
    const relatorioPorCrianca = new Map(
      (relatoriosHoje ?? []).map((r) => [r.crianca_id, r]),
    );

    const outroId = ultimaMensagem
      ? ultimaMensagem.remetente_id === perfil.id
        ? ultimaMensagem.destinatario_id
        : ultimaMensagem.remetente_id
      : null;

    const [assinadasResp, outroResp] = await Promise.all([
      fotos && fotos.length > 0
        ? supabase.storage
            .from("fotos-turmas")
            .createSignedUrls(
              fotos.map((f) => f.caminho),
              UMA_HORA,
            )
        : Promise.resolve({ data: [] }),
      outroId
        ? supabase.from("perfis").select("nome").eq("id", outroId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    type UrlAssinado = { path: string | null; signedUrl: string | null };
    const urlPorCaminho = new Map(
      ((assinadasResp.data ?? []) as UrlAssinado[])
        .filter((a): a is UrlAssinado & { signedUrl: string } => !!a.signedUrl)
        .map((a) => [a.path ?? "", a.signedUrl]),
    );
    const nomeOutroContacto = outroResp.data?.nome ?? null;
    const avatares = await assinarAvatares(
      supabase,
      (criancas ?? []).map((c) => c.foto_caminho),
    );

    function resumoRefeicao(valor: string | null | undefined) {
      return valor ? ETIQUETA_REFEICAO[valor] : "—";
    }

    return (
      <main className="min-h-screen bg-brand-bg px-4 py-10 dark:bg-brand-bg-dark">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          {cabecalho}
          {nav}

          <Link
            href="/painel/entrada-saida"
            className="flex items-center justify-between gap-3 rounded-2xl border border-brand-accent-soft bg-brand-accent-soft px-5 py-3 text-brand-accent transition-colors hover:bg-brand-accent hover:text-white dark:border-brand-accent-soft-dark dark:bg-brand-accent-soft-dark"
          >
            <span className="text-sm font-medium">
              🚪 Registar entrada ou saída agora
            </span>
            <span>→</span>
          </Link>

          <PageFade>
            <StaggerList className="flex flex-col gap-5">
              {criancas && criancas.length > 0 ? (
                criancas.map((c) => {
                  const presenca = presencaPorCrianca.get(c.id);
                  const relatorio = relatorioPorCrianca.get(c.id);
                  const refeicao =
                    resumoRefeicao(relatorio?.lanche) !== "—"
                      ? `Lanche: ${resumoRefeicao(relatorio?.lanche)}`
                      : resumoRefeicao(relatorio?.almoco) !== "—"
                        ? `Almoço: ${resumoRefeicao(relatorio?.almoco)}`
                        : resumoRefeicao(relatorio?.pequeno_almoco) !== "—"
                          ? `P. almoço: ${resumoRefeicao(relatorio?.pequeno_almoco)}`
                          : "—";
                  const cor = c.turma_id
                    ? corTurma(indiceTurma.get(c.turma_id) ?? 0)
                    : null;

                  return (
                    <StaggerItem
                      key={c.id}
                      className="rounded-2xl border border-brand-border bg-brand-surface p-5 dark:border-brand-border-dark dark:bg-brand-surface-dark"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar
                            nome={c.nome}
                            src={c.foto_caminho ? avatares.get(c.foto_caminho) : null}
                            tamanho="lg"
                          />
                          <div>
                            <h2 className="font-semibold text-brand-ink dark:text-brand-ink-dark">
                              {c.nome}
                            </h2>
                            {c.turma_id && cor && (
                              <span
                                className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cor.bg} ${cor.texto}`}
                              >
                                {nomeTurma.get(c.turma_id)}
                              </span>
                            )}
                          </div>
                        </div>
                        {presenca?.hora_entrada && !presenca.hora_saida && (
                          <span className="flex items-center gap-1.5 rounded-full bg-brand-positive-soft px-3 py-1 text-xs font-semibold text-brand-positive dark:bg-brand-positive-soft-dark">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-positive" />
                            Na creche · {formatarHoraPT(presenca.hora_entrada)}
                          </span>
                        )}
                        {presenca?.hora_saida && (
                          <span className="text-xs font-medium text-brand-muted dark:text-brand-muted-dark">
                            Saiu às {formatarHoraPT(presenca.hora_saida)}
                          </span>
                        )}
                        {!presenca?.hora_entrada && (
                          <span className="text-xs font-medium text-brand-muted dark:text-brand-muted-dark">
                            Ainda não chegou
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <ResumoTile tipo="meal" emoji="🍎" rotulo="Refeição" valor={refeicao} />
                        <ResumoTile
                          tipo="sleep"
                          emoji="😴"
                          rotulo="Sesta"
                          valor={
                            relatorio?.sono_inicio
                              ? `${relatorio.sono_inicio.slice(0, 5)}${relatorio.sono_fim ? `–${relatorio.sono_fim.slice(0, 5)}` : ""}`
                              : "—"
                          }
                        />
                        <ResumoTile
                          tipo="diaper"
                          emoji="🧷"
                          rotulo="Fraldas"
                          valor={
                            relatorio ? `${relatorio.fraldas_trocadas}×` : "—"
                          }
                        />
                      </div>
                    </StaggerItem>
                  );
                })
              ) : (
                <StaggerItem className="rounded-2xl border border-brand-border bg-brand-surface p-5 text-sm text-brand-muted dark:border-brand-border-dark dark:bg-brand-surface-dark dark:text-brand-muted-dark">
                  Ainda não há educandos associados à sua conta.
                </StaggerItem>
              )}

              {fotos && fotos.length > 0 && (
                <StaggerItem className="rounded-2xl border border-brand-border bg-brand-surface p-5 dark:border-brand-border-dark dark:bg-brand-surface-dark">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-semibold text-brand-ink dark:text-brand-ink-dark">
                      Fotos recentes
                    </h2>
                    <Link
                      href="/painel/fotos"
                      className="text-xs font-medium text-brand-accent hover:underline"
                    >
                      Ver todas
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {fotos.map((f) => {
                      const url = urlPorCaminho.get(f.caminho);
                      return (
                        <div
                          key={f.id}
                          className="aspect-square overflow-hidden rounded-xl bg-tile-photo-soft dark:bg-tile-photo-soft-dark"
                        >
                          {url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={url}
                              alt={f.legenda ?? "Foto da turma"}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </StaggerItem>
              )}

              {ultimaMensagem && (
                <StaggerItem>
                  <Link
                    href="/painel/mensagens"
                    className="flex items-center justify-between gap-3 rounded-2xl border border-brand-border bg-brand-surface p-4 transition-colors hover:border-brand-accent dark:border-brand-border-dark dark:bg-brand-surface-dark"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-ink dark:text-brand-ink-dark">
                        💬 {nomeOutroContacto ?? "Mensagens"}
                      </p>
                      <p className="truncate text-sm text-brand-muted dark:text-brand-muted-dark">
                        {ultimaMensagem.corpo}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-brand-muted dark:text-brand-muted-dark">
                      {formatarDataHoraPT(ultimaMensagem.criado_em)}
                    </span>
                  </Link>
                </StaggerItem>
              )}
            </StaggerList>
          </PageFade>
        </div>
      </main>
    );
  }

  // =====================================================================
  // ADMIN / STAFF — visão geral das turmas e presenças de hoje.
  // =====================================================================
  const hoje = hojeISO();

  const [{ data: turmas }, { data: criancas }] = await Promise.all([
    supabase.from("turmas").select("id, nome").order("nome"),
    supabase.from("criancas").select("id, turma_id").order("nome"),
  ]);

  const idsCriancas = (criancas ?? []).map((c) => c.id);
  const { data: presencasHoje } = idsCriancas.length
    ? await supabase
        .from("presencas")
        .select("crianca_id, hora_entrada, hora_saida")
        .eq("data", hoje)
        .in("crianca_id", idsCriancas)
    : { data: [] };

  const presentesAgora = (presencasHoje ?? []).filter(
    (p) => p.hora_entrada && !p.hora_saida,
  ).length;

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 dark:bg-brand-bg-dark">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        {cabecalho}
        {nav}

        <PageFade>
          <StaggerList className="flex flex-col gap-6">
            <StaggerItem className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 text-center dark:border-brand-border-dark dark:bg-brand-surface-dark">
                <p className="text-2xl font-bold text-brand-ink dark:text-brand-ink-dark">
                  {presentesAgora}
                </p>
                <p className="text-xs font-medium text-brand-muted dark:text-brand-muted-dark">
                  Presentes agora
                </p>
              </div>
              <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 text-center dark:border-brand-border-dark dark:bg-brand-surface-dark">
                <p className="text-2xl font-bold text-brand-ink dark:text-brand-ink-dark">
                  {criancas?.length ?? 0}
                </p>
                <p className="text-xs font-medium text-brand-muted dark:text-brand-muted-dark">
                  Crianças visíveis
                </p>
              </div>
              <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 text-center dark:border-brand-border-dark dark:bg-brand-surface-dark">
                <p className="text-2xl font-bold text-brand-ink dark:text-brand-ink-dark">
                  {turmas?.length ?? 0}
                </p>
                <p className="text-xs font-medium text-brand-muted dark:text-brand-muted-dark">
                  Turmas
                </p>
              </div>
            </StaggerItem>

            <StaggerItem className="rounded-2xl border border-brand-border bg-brand-surface p-5 dark:border-brand-border-dark dark:bg-brand-surface-dark">
              <h2 className="mb-3 font-semibold text-brand-ink dark:text-brand-ink-dark">
                Turmas
              </h2>
              {turmas && turmas.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {turmas.map((t, i) => {
                    const cor = corTurma(i);
                    return (
                      <li
                        key={t.id}
                        className={`rounded-full px-3 py-1 text-sm font-medium ${cor.bg} ${cor.texto}`}
                      >
                        {t.nome}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
                  Nenhuma turma visível.
                </p>
              )}
            </StaggerItem>

            <StaggerItem className="flex flex-wrap gap-3">
              <Link
                href="/painel/presencas"
                className="rounded-full bg-brand-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover"
              >
                Registar presenças
              </Link>
              <Link
                href="/painel/relatorios"
                className="rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-accent-soft dark:border-brand-border-dark dark:text-brand-ink-dark dark:hover:bg-brand-accent-soft-dark"
              >
                Preencher relatórios
              </Link>
              <Link
                href="/painel/mural"
                className="rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-accent-soft dark:border-brand-border-dark dark:text-brand-ink-dark dark:hover:bg-brand-accent-soft-dark"
              >
                Publicar aviso
              </Link>
              <Link
                href="/painel/codigo-entrada"
                className="rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-accent-soft dark:border-brand-border-dark dark:text-brand-ink-dark dark:hover:bg-brand-accent-soft-dark"
              >
                Código QR de entrada
              </Link>
            </StaggerItem>
          </StaggerList>
        </PageFade>
      </div>
    </main>
  );
}
