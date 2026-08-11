import { createClient } from "@/lib/supabase/server";

/**
 * Contagens de notificações por ler do utilizador autenticado, por
 * tipo — separadas porque cada uma alimenta um badge diferente na
 * navegação (Mural / Mensagens). Não filtra por `perfil_id`
 * explicitamente: a política de RLS já garante que só as notificações
 * do próprio aparecem.
 */
export async function contarNotificacoesPorTipo() {
  const supabase = await createClient();
  const [avisos, mensagens] = await Promise.all([
    supabase
      .from("notificacoes")
      .select("id", { count: "exact", head: true })
      .eq("lida", false)
      .eq("tipo", "aviso"),
    supabase
      .from("notificacoes")
      .select("id", { count: "exact", head: true })
      .eq("lida", false)
      .eq("tipo", "mensagem"),
  ]);
  return { avisos: avisos.count ?? 0, mensagens: mensagens.count ?? 0 };
}
