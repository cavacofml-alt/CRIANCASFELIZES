"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CAMPO =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

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
    <form
      onSubmit={publicar}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="font-semibold text-black dark:text-zinc-50">
        Publicar novo aviso
      </h2>

      {papel === "admin" && (
        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
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
        <label className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
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

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <button
        type="submit"
        disabled={aEnviar}
        className="self-start rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
      >
        {aEnviar ? "A publicar…" : "Publicar"}
      </button>
    </form>
  );
}
