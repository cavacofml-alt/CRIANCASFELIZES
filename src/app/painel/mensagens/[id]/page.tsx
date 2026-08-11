import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesPorTipo } from "@/lib/notificacoes";
import { formatarDataHoraPT } from "@/lib/data";
import { BotaoSair } from "../../botao-sair";
import { PainelNav } from "../../nav";
import { PageFade, StaggerList, StaggerItem } from "../../motion";
import { NovaMensagemForm } from "../nova-mensagem-form";

export default async function ConversaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: contactoId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("id, nome, escola_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!perfil) redirect("/painel");

  // Se o RLS não deixar ver este perfil, não é um contacto válido.
  const { data: contacto } = await supabase
    .from("perfis")
    .select("id, nome")
    .eq("id", contactoId)
    .maybeSingle();
  if (!contacto) redirect("/painel/mensagens");

  const { data: mensagens } = await supabase
    .from("mensagens")
    .select("id, remetente_id, destinatario_id, corpo, lida_em, criado_em")
    .or(`remetente_id.eq.${contactoId},destinatario_id.eq.${contactoId}`)
    .order("criado_em", { ascending: true });

  // Marca como lidas as mensagens recebidas ainda por ler nesta conversa,
  // e as notificações associadas a elas (só destas, não de outras conversas).
  const porLer = (mensagens ?? []).filter(
    (m) => m.destinatario_id === perfil.id && m.lida_em === null,
  );
  if (porLer.length > 0) {
    await Promise.all(
      porLer.map((m) =>
        supabase.rpc("marcar_mensagem_lida", { mensagem_id: m.id }),
      ),
    );
    await supabase.rpc("marcar_notificacoes_mensagens_lidas", {
      ids: porLer.map((m) => m.id),
    });
  }

  const { avisos: contagemAvisos, mensagens: contagemMensagens } =
    await contarNotificacoesPorTipo();

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 dark:bg-brand-bg-dark">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-dark">
              {contacto.nome}
            </h1>
            <Link
              href="/painel/mensagens"
              className="mt-1 inline-block text-sm text-brand-accent hover:underline"
            >
              ← Todas as conversas
            </Link>
          </div>
          <BotaoSair />
        </header>

        <PainelNav
          contagemAvisos={contagemAvisos}
          contagemMensagens={contagemMensagens}
        />

        <PageFade>
          <StaggerList className="flex flex-col gap-3 rounded-2xl border border-brand-border bg-brand-surface p-5 dark:border-brand-border-dark dark:bg-brand-surface-dark">
            {mensagens && mensagens.length > 0 ? (
              mensagens.map((m) => {
                const minha = m.remetente_id === perfil.id;
                return (
                  <StaggerItem
                    key={m.id}
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      minha
                        ? "self-end bg-brand-accent text-white"
                        : "self-start bg-brand-accent-soft text-brand-ink dark:bg-brand-accent-soft-dark dark:text-brand-ink-dark"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.corpo}</p>
                    <p
                      className={`mt-1 text-[11px] ${minha ? "text-white/70" : "text-brand-muted dark:text-brand-muted-dark"}`}
                    >
                      {formatarDataHoraPT(m.criado_em)}
                    </p>
                  </StaggerItem>
                );
              })
            ) : (
              <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
                Ainda não há mensagens nesta conversa.
              </p>
            )}
          </StaggerList>
        </PageFade>

        <NovaMensagemForm
          escolaId={perfil.escola_id}
          remetenteId={perfil.id}
          destinatarioId={contacto.id}
        />
      </div>
    </main>
  );
}
