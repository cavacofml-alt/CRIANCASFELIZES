import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hojeISO, formatarDataExtensaPT } from "@/lib/data";
import { assinarAvatares } from "@/lib/avatares";
import { BotaoSair } from "../botao-sair";
import { RegistoFamilia } from "./registo-familia";

// Página pensada para ser aberta a partir do QR code afixado à
// entrada da escola — sem navegação do painel à volta, de propósito:
// é para ser rápida de usar de manhã e à tarde, num telemóvel, sem
// distrações. Quem quiser voltar ao resto da app usa o botão "Sair"
// ou o link no fim.
export default async function EntradaSaidaPage() {
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
  if (perfil.papel !== "encarregado") redirect("/painel");

  const hoje = hojeISO();

  const [{ data: criancas }, { data: presencasHoje }, { data: autorizados }] =
    await Promise.all([
      supabase
        .from("criancas")
        .select("id, nome, foto_caminho")
        .order("nome"),
      supabase
        .from("presencas")
        .select("id, crianca_id, hora_entrada, hora_saida, levantado_por_nome")
        .eq("data", hoje),
      supabase
        .from("autorizacoes_recolha")
        .select("crianca_id, nome"),
    ]);

  const presencaPorCrianca = new Map(
    (presencasHoje ?? []).map((p) => [p.crianca_id, p]),
  );

  const avatares = await assinarAvatares(
    supabase,
    (criancas ?? []).map((c) => c.foto_caminho),
  );

  return (
    <main className="flex min-h-screen flex-col items-center bg-brand-bg px-4 py-10 dark:bg-brand-bg-dark">
      <div className="flex w-full max-w-md flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-dark">
              Entrada e saída
            </h1>
            <p className="mt-1 text-brand-muted dark:text-brand-muted-dark">
              {perfil.nome} · {formatarDataExtensaPT(hoje)}
            </p>
          </div>
          <BotaoSair />
        </header>

        <div className="flex flex-col gap-4">
          {criancas && criancas.length > 0 ? (
            criancas.map((c) => (
              <RegistoFamilia
                key={c.id}
                escolaId={perfil.escola_id}
                criancaId={c.id}
                criancaNome={c.nome}
                fotoUrl={c.foto_caminho ? (avatares.get(c.foto_caminho) ?? null) : null}
                data={hoje}
                perfilId={perfil.id}
                perfilNome={perfil.nome}
                presenca={presencaPorCrianca.get(c.id) ?? null}
                autorizados={(autorizados ?? []).filter((a) => a.crianca_id === c.id)}
              />
            ))
          ) : (
            <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
              Ainda não há nenhuma criança associada à sua conta.
            </p>
          )}
        </div>

        <a
          href="/painel"
          className="self-center text-sm text-brand-accent hover:underline"
        >
          Ir para a aplicação →
        </a>
      </div>
    </main>
  );
}
