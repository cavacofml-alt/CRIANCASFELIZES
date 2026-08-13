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

type Crianca = {
  id: string;
  nome: string;
  turma_id: string | null;
  consentimento_fotos: boolean;
};

export function UploadFotoForm({
  escolaId,
  perfilId,
  turmas,
  criancas,
}: {
  escolaId: string;
  perfilId: string;
  turmas: { id: string; nome: string }[];
  criancas: Crianca[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [turmaId, setTurmaId] = useState(turmas[0]?.id ?? "");
  const [legenda, setLegenda] = useState("");
  const [criancasMarcadas, setCriancasMarcadas] = useState<Set<string>>(new Set());
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const criancasDaTurma = criancas.filter((c) => c.turma_id === turmaId);

  function alternarCrianca(id: string) {
    setCriancasMarcadas((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

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

    const { data: foto, error: errInsert } = await supabase
      .from("fotos")
      .insert({
        escola_id: escolaId,
        turma_id: turmaId,
        caminho,
        legenda: legenda.trim() || null,
        autor_id: perfilId,
      })
      .select("id")
      .single();

    if (errInsert || !foto) {
      await supabase.storage.from("fotos-turmas").remove([caminho]);
      setAEnviar(false);
      setErro("Não foi possível guardar a foto.");
      return;
    }

    if (criancasMarcadas.size > 0) {
      const { error: errMarcacoes } = await supabase.from("foto_criancas").insert(
        [...criancasMarcadas].map((criancaId) => ({
          foto_id: foto.id,
          crianca_id: criancaId,
        })),
      );
      if (errMarcacoes) {
        setAEnviar(false);
        setErro(
          "A foto foi enviada, mas não foi possível marcar as crianças — só a equipa a vai ver.",
        );
        return;
      }
    }

    setAEnviar(false);
    setLegenda("");
    setCriancasMarcadas(new Set());
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
            onChange={(e) => {
              setTurmaId(e.target.value);
              setCriancasMarcadas(new Set());
            }}
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

      {criancasDaTurma.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-brand-ink dark:text-brand-ink-dark">
            Quem aparece na foto?
          </p>
          <p className="mb-2 text-xs text-brand-muted dark:text-brand-muted-dark">
            Só as famílias das crianças marcadas vão ver esta foto.
          </p>
          <div className="flex flex-wrap gap-2">
            {criancasDaTurma.map((c) => (
              <label
                key={c.id}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
                  !c.consentimento_fotos
                    ? "cursor-not-allowed border-brand-border text-brand-muted opacity-60 dark:border-brand-border-dark dark:text-brand-muted-dark"
                    : criancasMarcadas.has(c.id)
                      ? "border-brand-accent bg-brand-accent-soft text-brand-accent dark:bg-brand-accent-soft-dark"
                      : "border-brand-border text-brand-ink hover:border-brand-accent dark:border-brand-border-dark dark:text-brand-ink-dark"
                }`}
                title={
                  !c.consentimento_fotos
                    ? "Esta criança não tem autorização de fotos"
                    : undefined
                }
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  disabled={!c.consentimento_fotos}
                  checked={criancasMarcadas.has(c.id)}
                  onChange={() => alternarCrianca(c.id)}
                />
                {c.nome}
                {!c.consentimento_fotos && " (sem autorização)"}
              </label>
            ))}
          </div>
        </div>
      )}

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
