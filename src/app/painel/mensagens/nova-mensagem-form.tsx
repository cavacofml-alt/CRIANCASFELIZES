"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { CAMPO, BOTAO_PRIMARIO } from "../estilos";

export function NovaMensagemForm({
  escolaId,
  remetenteId,
  destinatarioId,
}: {
  escolaId: string;
  remetenteId: string;
  destinatarioId: string;
}) {
  const router = useRouter();
  const [corpo, setCorpo] = useState("");
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!corpo.trim()) return;

    setAEnviar(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.from("mensagens").insert({
      escola_id: escolaId,
      remetente_id: remetenteId,
      destinatario_id: destinatarioId,
      corpo: corpo.trim(),
    });
    setAEnviar(false);

    if (error) {
      setErro("Não foi possível enviar a mensagem.");
      return;
    }
    setCorpo("");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="flex gap-2">
      <input
        value={corpo}
        onChange={(e) => setCorpo(e.target.value)}
        placeholder="Escreva uma mensagem…"
        className={`flex-1 ${CAMPO}`}
      />
      <motion.button
        whileTap={{ scale: 0.96 }}
        type="submit"
        disabled={aEnviar}
        className={`shrink-0 ${BOTAO_PRIMARIO}`}
      >
        {aEnviar ? "A enviar…" : "Enviar"}
      </motion.button>
      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}
    </form>
  );
}
