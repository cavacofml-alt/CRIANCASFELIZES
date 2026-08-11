import { createClient } from "@/lib/supabase/server";

/**
 * Conta notificações por ler do utilizador autenticado. Não filtra por
 * `perfil_id` explicitamente: a política de RLS já garante que só as
 * notificações do próprio aparecem.
 */
export async function contarNotificacoesNaoLidas() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notificacoes")
    .select("id", { count: "exact", head: true })
    .eq("lida", false);
  return count ?? 0;
}
