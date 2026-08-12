"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { CAMPO, BOTAO_PRIMARIO, BOTAO_SECUNDARIO } from "../estilos";

type Autorizacao = {
  id: string;
  nome: string;
  parentesco: string | null;
  telefone: string | null;
};

export function AutorizacoesRecolha({
  escolaId,
  criancaId,
  perfilId,
  autorizacoes,
}: {
  escolaId: string;
  criancaId: string;
  perfilId: string;
  autorizacoes: Autorizacao[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function adicionar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setAGuardar(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.from("autorizacoes_recolha").insert({
      escola_id: escolaId,
      crianca_id: criancaId,
      nome: nome.trim(),
      parentesco: parentesco.trim() || null,
      telefone: telefone.trim() || null,
      criado_por: perfilId,
    });
    setAGuardar(false);
    if (error) {
      setErro("Não foi possível adicionar.");
      return;
    }
    setNome("");
    setParentesco("");
    setTelefone("");
    setAberto(false);
    router.refresh();
  }

  async function remover(id: string) {
    const supabase = createClient();
    await supabase.from("autorizacoes_recolha").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {autorizacoes.length > 0 ? (
        <ul className="flex flex-col divide-y divide-brand-border dark:divide-brand-border-dark">
          {autorizacoes.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="text-brand-ink dark:text-brand-ink-dark">
                {a.nome}
                {a.parentesco && (
                  <span className="text-brand-muted dark:text-brand-muted-dark"> · {a.parentesco}</span>
                )}
                {a.telefone && (
                  <span className="text-brand-muted dark:text-brand-muted-dark"> · {a.telefone}</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => remover(a.id)}
                className="text-xs text-red-600 hover:underline dark:text-red-400"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
          Ainda não adicionou ninguém à lista.
        </p>
      )}

      {!aberto ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setAberto(true)}
          className={`self-start ${BOTAO_SECUNDARIO}`}
        >
          + Adicionar pessoa autorizada
        </motion.button>
      ) : (
        <form onSubmit={adicionar} className="flex flex-col gap-2 rounded-xl border border-brand-border p-3 dark:border-brand-border-dark">
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" className={CAMPO} />
          <input value={parentesco} onChange={(e) => setParentesco(e.target.value)} placeholder="Relação (ex.: avó)" className={CAMPO} />
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone (opcional)" className={CAMPO} />
          {erro && <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>}
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.96 }} type="submit" disabled={aGuardar} className={BOTAO_PRIMARIO}>
              {aGuardar ? "A guardar…" : "Guardar"}
            </motion.button>
            <button type="button" onClick={() => setAberto(false)} className={BOTAO_SECUNDARIO}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
