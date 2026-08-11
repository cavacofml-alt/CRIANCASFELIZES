import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesPorTipo } from "@/lib/notificacoes";
import { formatarDataHoraPT } from "@/lib/data";
import { BotaoSair } from "../botao-sair";
import { PainelNav } from "../nav";
import { UploadFotoForm } from "./upload-foto-form";
import { ApagarFotoBotao } from "./apagar-foto-botao";

const UMA_HORA = 60 * 60;

export default async function FotosPage() {
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

  const { avisos: contagemAvisos, mensagens: contagemMensagens } =
    await contarNotificacoesPorTipo();

  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome")
    .order("nome");
  const nomeTurma = new Map((turmas ?? []).map((t) => [t.id, t.nome]));

  const { data: fotos } = await supabase
    .from("fotos")
    .select("id, turma_id, caminho, legenda, autor_id, criado_em")
    .order("criado_em", { ascending: false });

  const { data: autores } = await supabase.from("perfis").select("id, nome");
  const nomeAutor = new Map((autores ?? []).map((a) => [a.id, a.nome]));

  let urlPorCaminho = new Map<string, string>();
  if (fotos && fotos.length > 0) {
    const { data: assinadas } = await supabase.storage
      .from("fotos-turmas")
      .createSignedUrls(
        fotos.map((f) => f.caminho),
        UMA_HORA,
      );
    urlPorCaminho = new Map(
      (assinadas ?? [])
        .filter((a): a is typeof a & { signedUrl: string } => !!a.signedUrl)
        .map((a) => [a.path ?? "", a.signedUrl]),
    );
  }

  const podeEnviar = perfil.papel === "admin" || perfil.papel === "staff";

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50">
              Fotos
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {perfil.nome}
            </p>
          </div>
          <BotaoSair />
        </header>

        <PainelNav
          contagemAvisos={contagemAvisos}
          contagemMensagens={contagemMensagens}
        />

        {podeEnviar && (
          <UploadFotoForm
            escolaId={perfil.escola_id}
            perfilId={perfil.id}
            turmas={turmas ?? []}
          />
        )}

        {fotos && fotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {fotos.map((f) => {
              const url = urlPorCaminho.get(f.caminho);
              const podeApagar =
                perfil.papel === "admin" || f.autor_id === perfil.id;
              return (
                <figure
                  key={f.id}
                  className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={f.legenda ?? "Foto da turma"}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center text-xs text-zinc-400">
                      Imagem indisponível
                    </div>
                  )}
                  {podeApagar && (
                    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <ApagarFotoBotao fotoId={f.id} caminho={f.caminho} />
                    </div>
                  )}
                  <figcaption className="p-2 text-xs text-zinc-500">
                    <p className="font-medium text-zinc-700 dark:text-zinc-300">
                      {nomeTurma.get(f.turma_id) ?? "Turma"}
                    </p>
                    {f.legenda && <p>{f.legenda}</p>}
                    <p>
                      {nomeAutor.get(f.autor_id) ?? "—"} ·{" "}
                      {formatarDataHoraPT(f.criado_em)}
                    </p>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Ainda não há fotos.</p>
        )}
      </div>
    </main>
  );
}
