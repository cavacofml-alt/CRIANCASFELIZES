import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesNaoLidas } from "@/lib/notificacoes";
import { BotaoSair } from "../botao-sair";
import { PainelNav } from "../nav";

const ETIQUETA_PAPEL: Record<string, string> = {
  admin: "Administração",
  staff: "Educador(a)",
  encarregado: "Encarregado(a) de educação",
};

export default async function MensagensPage() {
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

  // RLS já limita quem aparece aqui: para um encarregado, só staff das
  // turmas dos seus educandos e a administração; para staff, a sua
  // equipa e os encarregados das suas turmas; para admin, toda a escola.
  const { data: perfisVisiveis } = await supabase
    .from("perfis")
    .select("id, nome, papel")
    .neq("id", perfil.id)
    .order("nome");

  // Staff vê colegas (para efeitos do mural/equipa), mas as políticas de
  // `mensagens` só permitem contactar encarregados das suas turmas e a
  // administração — a lista de "iniciar conversa" reflete isso.
  const contactosPermitidos = (perfisVisiveis ?? []).filter((p) =>
    perfil.papel === "staff" ? p.papel === "admin" || p.papel === "encarregado" : true,
  );

  const { data: mensagens } = await supabase
    .from("mensagens")
    .select("remetente_id, destinatario_id, corpo, lida_em, criado_em")
    .order("criado_em", { ascending: false });

  const nomePorId = new Map(
    (perfisVisiveis ?? []).map((p) => [p.id, p.nome] as const),
  );

  type Conversa = {
    contactoId: string;
    ultimaMensagem: string;
    ultimaData: string;
    naoLidas: number;
  };
  const conversas = new Map<string, Conversa>();
  for (const m of mensagens ?? []) {
    const outro = m.remetente_id === perfil.id ? m.destinatario_id : m.remetente_id;
    if (!conversas.has(outro)) {
      conversas.set(outro, {
        contactoId: outro,
        ultimaMensagem: m.corpo,
        ultimaData: m.criado_em,
        naoLidas: 0,
      });
    }
    if (m.destinatario_id === perfil.id && m.lida_em === null) {
      conversas.get(outro)!.naoLidas++;
    }
  }

  const contactosSemConversa = contactosPermitidos.filter(
    (p) => !conversas.has(p.id),
  );

  const contagemNaoLidas = await contarNotificacoesNaoLidas();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50">
              Mensagens
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {perfil.nome}
            </p>
          </div>
          <BotaoSair />
        </header>

        <PainelNav contagemNaoLidas={contagemNaoLidas} />

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold text-black dark:text-zinc-50">
            Conversas
          </h2>
          {conversas.size > 0 ? (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {[...conversas.values()].map((c) => (
                <li key={c.contactoId}>
                  <Link
                    href={`/painel/mensagens/${c.contactoId}`}
                    className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {nomePorId.get(c.contactoId) ?? "Utilizador"}
                      </p>
                      <p className="truncate text-sm text-zinc-500">
                        {c.ultimaMensagem}
                      </p>
                    </div>
                    {c.naoLidas > 0 && (
                      <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                        {c.naoLidas}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Ainda não tem conversas.</p>
          )}
        </section>

        {contactosSemConversa.length > 0 && (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 font-semibold text-black dark:text-zinc-50">
              Iniciar nova conversa
            </h2>
            <ul className="flex flex-wrap gap-2">
              {contactosSemConversa.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/painel/mensagens/${p.id}`}
                    className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    {p.nome}{" "}
                    <span className="text-zinc-500">
                      · {ETIQUETA_PAPEL[p.papel] ?? p.papel}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
