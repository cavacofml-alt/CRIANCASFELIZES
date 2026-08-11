"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { CAMPO, BOTAO_PRIMARIO } from "../painel/estilos";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aCarregar, setACarregar] = useState(false);

  async function aoSubmeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setACarregar(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Mensagem genérica de propósito: não revelamos se o email existe.
      setErro("Email ou palavra-passe incorretos.");
      setACarregar(false);
      return;
    }

    router.push("/painel");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 dark:bg-brand-bg-dark">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-dark">
          Crianças Felizes
        </h1>
        <p className="mb-8 text-center text-sm text-brand-muted dark:text-brand-muted-dark">
          Entre com a conta fornecida pela escola.
        </p>

        <form onSubmit={aoSubmeter} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-ink dark:text-brand-ink-dark">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={CAMPO}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-ink dark:text-brand-ink-dark">
              Palavra-passe
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={CAMPO}
            />
          </label>

          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {erro}
            </p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={aCarregar}
            className={`mt-2 ${BOTAO_PRIMARIO}`}
          >
            {aCarregar ? "A entrar…" : "Entrar"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
