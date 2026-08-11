import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesNaoLidas } from "@/lib/notificacoes";
import { BotaoSair } from "../../botao-sair";
import { PainelNav } from "../../nav";
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

  const contagemNaoLidas = await contarNotificacoesNaoLidas();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50">
              {contacto.nome}
            </h1>
            <Link
              href="/painel/mensagens"
              className="mt-1 inline-block text-sm text-zinc-500 hover:underline"
            >
              ← Todas as conversas
            </Link>
          </div>
          <BotaoSair />
        </header>

        <PainelNav contagemNaoLidas={contagemNaoLidas} />

        <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          {mensagens && mensagens.length > 0 ? (
            mensagens.map((m) => {
              const minha = m.remetente_id === perfil.id;
              return (
                <div
                  key={m.id}
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    minha
                      ? "self-end bg-black text-white dark:bg-zinc-50 dark:text-black"
                      : "self-start bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.corpo}</p>
                  <p
                    className={`mt-1 text-[11px] ${minha ? "opacity-70" : "text-zinc-500"}`}
                  >
                    {new Date(m.criado_em).toLocaleString("pt-PT")}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-zinc-500">
              Ainda não há mensagens nesta conversa.
            </p>
          )}
        </section>

        <NovaMensagemForm
          escolaId={perfil.escola_id}
          remetenteId={perfil.id}
          destinatarioId={contacto.id}
        />
      </div>
    </main>
  );
}
