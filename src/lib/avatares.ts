import type { SupabaseClient } from "@supabase/supabase-js";

const UMA_HORA = 60 * 60;

/** Assina em lote os caminhos de avatar (bucket `avatares-criancas`),
 * devolvendo um mapa caminho -> URL assinada. Caminhos nulos são
 * ignorados. Nunca lança erro — na pior das hipóteses o mapa fica
 * incompleto e o componente Avatar cai para as iniciais. */
export async function assinarAvatares(
  supabase: SupabaseClient,
  caminhos: (string | null | undefined)[],
) {
  const validos = [...new Set(caminhos.filter((c): c is string => !!c))];
  if (validos.length === 0) return new Map<string, string>();

  const { data } = await supabase.storage
    .from("avatares-criancas")
    .createSignedUrls(validos, UMA_HORA);

  const mapa = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) mapa.set(item.path, item.signedUrl);
  }
  return mapa;
}
