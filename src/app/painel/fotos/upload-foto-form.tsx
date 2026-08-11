"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { CAMPO, BOTAO_PRIMARIO } from "../estilos";

const DIACRITICOS = new RegExp(
  "[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]",
  "g",
);

function caminhoSeguro(nomeFicheiro: string) {
  return nomeFicheiro
    .normalize("NFD")
    .replace(DIACRITICOS, "")
    .replace(/[^a-zA-Z0-9.]/g, "-");
}

export function UploadFotoForm({
  escolaId,
  perfilId,
  turmas,
}: {
  escolaId: string;
  perfilId: string;
  turmas: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [turmaId, setTurmaId] = useState(turmas[0]?.id ?? "");
  const [legenda, setLegenda] = useState("");
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const ficheiro = inputRef.current?.files?.[0];
    if (!ficheiro || !turmaId) return;

    setAEnviar(true);
    setErro(null);
    const supabase = createClient();

    const caminho = `${escolaId}/${turmaId}/${Date.now()}-${caminhoSeguro(ficheiro.name)}`;
    const { error: errUpload } = await supabase.storage
      .from("fotos-turmas")
      .upload(caminho, ficheiro, { contentType: ficheiro.type });

    if (errUpload) {
      setAEnviar(false);
      setErro("Não foi possível enviar a foto.");
      return;
    }

    const { error: errInsert } = await supabase.from("fotos").insert({
      escola_id: escolaId,
      turma_id: turmaId,
      caminho,
      legenda: legenda.trim() || null,
      autor_id: perfilId,
    });

    setAEnviar(false);
    if (errInsert) {
      await supabase.storage.from("fotos-turmas").remove([caminho]);
      setErro("Não foi possível guardar a foto.");
      return;
    }

    setLegenda("");
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <form
      onSubmit={enviar}
      className="flex flex-col gap-3 rounded-2xl border border-brand-border bg-brand-surface p-5 dark:border-brand-border-dark dark:bg-brand-surface-dark"
    >
      <h2 className="font-semibold text-brand-ink dark:text-brand-ink-dark">
        Enviar foto
      </h2>

      {turmas.length > 1 && (
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

      <input ref={inputRef} type="file" accept="image/*" className={CAMPO} />

      <input
        value={legenda}
        onChange={(e) => setLegenda(e.target.value)}
        placeholder="Legenda (opcional)"
        className={CAMPO}
      />

      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

      <motion.button
        whileTap={{ scale: 0.96 }}
        type="submit"
        disabled={aEnviar || !turmaId}
        className={`self-start ${BOTAO_PRIMARIO}`}
      >
        {aEnviar ? "A enviar…" : "Enviar"}
      </motion.button>
    </form>
  );
}
