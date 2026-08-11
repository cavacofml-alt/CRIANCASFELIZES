"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
        className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
      />
      <button
        type="submit"
        disabled={aEnviar}
        className="shrink-0 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
      >
        {aEnviar ? "A enviar…" : "Enviar"}
      </button>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </form>
  );
}
