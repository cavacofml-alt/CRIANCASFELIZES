"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { BOTAO_PRIMARIO } from "../painel/estilos";
import { VERSAO_TERMOS_ATUAL, PONTOS_TERMOS } from "@/lib/consentimento";

export default function ConsentimentoPage() {
  const router = useRouter();
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aCarregar, setACarregar] = useState(false);

  async function aoConfirmar() {
    setErro(null);
    setACarregar(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("consentimentos_termos").insert({
      perfil_id: user.id,
      versao: VERSAO_TERMOS_ATUAL,
    });

    if (error) {
      setErro("Não foi possível registar a sua aceitação. Tente novamente.");
      setACarregar(false);
      return;
    }

    router.push("/painel");
    router.refresh();
  }

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-10 dark:bg-brand-bg-dark">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-lg rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm dark:border-brand-border-dark dark:bg-brand-surface-dark"
      >
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-dark">
          Antes de continuar
        </h1>
        <p className="mb-6 text-sm text-brand-muted dark:text-brand-muted-dark">
          Para usar a Crianças Felizes precisa de ler e aceitar como
          tratamos os dados da sua criança e da sua conta.
        </p>

        <ul className="mb-6 flex flex-col gap-4">
          {PONTOS_TERMOS.map((ponto) => (
            <li key={ponto.titulo}>
              <p className="text-sm font-semibold text-brand-ink dark:text-brand-ink-dark">
                {ponto.titulo}
              </p>
              <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
                {ponto.texto}
              </p>
            </li>
          ))}
        </ul>

        <label className="mb-4 flex items-start gap-3 text-sm text-brand-ink dark:text-brand-ink-dark">
          <input
            type="checkbox"
            checked={aceite}
            onChange={(e) => setAceite(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand-accent"
          />
          <span>
            Li e aceito a política de privacidade e os termos de
            utilização da Crianças Felizes.
          </span>
        </label>

        {erro && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {erro}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={sair}
            className="rounded-full px-4 py-2 text-sm font-medium text-brand-muted transition-colors hover:text-brand-ink dark:text-brand-muted-dark dark:hover:text-brand-ink-dark"
          >
            Sair
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            disabled={!aceite || aCarregar}
            onClick={aoConfirmar}
            className={`flex-1 ${BOTAO_PRIMARIO} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {aCarregar ? "A confirmar…" : "Confirmar e continuar"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
