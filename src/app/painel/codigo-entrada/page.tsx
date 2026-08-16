import { redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { contarNotificacoesPorTipo } from "@/lib/notificacoes";
import { BotaoSair } from "../botao-sair";
import { PainelNav } from "../nav";
import { BotaoImprimir } from "./botao-imprimir";

export default async function CodigoEntradaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: perfil }, notificacoes] = await Promise.all([
    supabase
      .from("perfis")
      .select("id, nome, papel, escola_id")
      .eq("id", user.id)
      .maybeSingle(),
    contarNotificacoesPorTipo(),
  ]);
  if (!perfil) redirect("/painel");
  if (perfil.papel !== "admin" && perfil.papel !== "staff") redirect("/painel");
  const { avisos: contagemAvisos, mensagens: contagemMensagens } = notificacoes;

  const cabecalhos = await headers();
  const host = cabecalhos.get("host") ?? "localhost:3000";
  const protocolo = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const url = `${protocolo}://${host}/painel/entrada-saida`;

  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 480,
    margin: 2,
    color: { dark: "#1E293B", light: "#FFFFFF" },
  });

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 dark:bg-brand-bg-dark">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-dark">
              Código de entrada
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

        <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 dark:border-brand-border-dark dark:bg-brand-surface-dark print:hidden">
          <h2 className="mb-2 font-semibold text-brand-ink dark:text-brand-ink-dark">
            Como usar
          </h2>
          <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
            Imprima o cartaz abaixo (botão &ldquo;Imprimir&rdquo;) e afixe-o à
            entrada da escola. Cada encarregado de educação aponta a câmara
            do telemóvel ao código e regista a entrada ou saída do seu
            próprio educando — só vê e só consegue registar os seus
            educandos, mesmo que o código seja o mesmo para toda a escola.
            Se alguém se esquecer, a equipa continua a poder registar
            manualmente em <span className="font-medium">Presenças</span>,
            como sempre.
          </p>
          <BotaoImprimir />
        </div>

        <div className="flex flex-col items-center gap-4 rounded-2xl border border-brand-border bg-white p-10 text-center dark:border-brand-border-dark print:border-none">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-muted">
            Registo de entradas e saídas
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- imagem gerada localmente (data URL), não há otimização a ganhar */}
          <img src={qrDataUrl} alt="Código QR para registo de entrada/saída" className="h-72 w-72" />
          <ol className="mt-2 flex flex-col gap-1 text-left text-sm text-brand-ink">
            <li>1. Abra a câmara do telemóvel</li>
            <li>2. Aponte para o código QR</li>
            <li>3. Confirme a entrada ou saída da criança</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
