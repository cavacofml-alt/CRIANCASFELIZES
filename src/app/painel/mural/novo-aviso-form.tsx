"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { CAMPO, BOTAO_PRIMARIO } from "../estilos";

export function NovoAvisoForm({
  perfilId,
  escolaId,
  papel,
  turmas,
}: {
  perfilId: string;
  escolaId: string;
  papel: string;
  turmas: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [turmaId, setTurmaId] = useState(
    papel === "admin" ? "" : (turmas[0]?.id ?? ""),
  );
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function publicar(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !corpo.trim()) return;

    setAEnviar(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.from("avisos").insert({
      escola_id: escolaId,
      turma_id: turmaId || null,
      autor_id: perfilId,
      titulo: titulo.trim(),
      corpo: corpo.trim(),
    });
    setAEnviar(false);

    if (error) {
      setErro("Não foi possível publicar o aviso.");
      return;
    }
    setTitulo("");
    setCorpo("");
    router.refresh();
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onSubmit={publicar}
      className="flex flex-col gap-3 rounded-2xl border border-brand-border bg-brand-surface p-5 dark:border-brand-border-dark dark:bg-brand-surface-dark"
    >
      <h2 className="font-semibold text-brand-ink dark:text-brand-ink-dark">
        Publicar novo aviso
      </h2>

      {papel === "admin" && (
        <label className="flex flex-col gap-1 text-sm text-brand-muted dark:text-brand-muted-dark">
          Destinatário
          <select
            value={turmaId}
            onChange={(e) => setTurmaId(e.target.value)}
            className={CAMPO}
          >
            <option value="">Toda a escola</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>
      )}

      {papel === "staff" && turmas.length > 1 && (
        <label className="flex flex-col gap-1 text-sm text-brand-muted dark:text-brand-muted-dark">
          Turma
          <select
            value={turmaId}
            onChange={(e) => setTurmaId(e.target.value)}
            className={CAMPO}
          >
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>
      )}

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título"
        className={CAMPO}
      />
      <textarea
        value={corpo}
        onChange={(e) => setCorpo(e.target.value)}
        placeholder="Mensagem"
        rows={3}
        className={CAMPO}
      />

      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

      <motion.button
        whileTap={{ scale: 0.96 }}
        type="submit"
        disabled={aEnviar}
        className={`self-start ${BOTAO_PRIMARIO}`}
      >
        {aEnviar ? "A publicar…" : "Publicar"}
      </motion.button>
    </motion.form>
  );
}
