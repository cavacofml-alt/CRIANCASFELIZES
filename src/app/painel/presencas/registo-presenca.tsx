"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { formatarHoraPT } from "@/lib/data";
import { CAMPO, BOTAO_PRIMARIO, BOTAO_SECUNDARIO } from "../estilos";

type Presenca = {
  id: string;
  hora_entrada: string | null;
  hora_saida: string | null;
  levantado_por_nome: string | null;
};

export function RegistoPresenca({
  escolaId,
  criancaId,
  data,
  perfilId,
  presenca,
  encarregados,
}: {
  escolaId: string;
  criancaId: string;
  data: string;
  perfilId: string;
  presenca: Presenca | null;
  encarregados: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aRegistarSaida, setARegistarSaida] = useState(false);
  const [levantadoPorId, setLevantadoPorId] = useState("");
  const [levantadoPorNome, setLevantadoPorNome] = useState("");

  async function registarEntrada() {
    setAGuardar(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.from("presencas").insert({
      escola_id: escolaId,
      crianca_id: criancaId,
      data,
      hora_entrada: new Date().toISOString(),
      registado_entrada_por: perfilId,
    });
    setAGuardar(false);
    if (error) {
      setErro("Não foi possível registar a entrada.");
      return;
    }
    router.refresh();
  }

  async function registarSaida() {
    const nome =
      levantadoPorNome.trim() ||
      encarregados.find((e) => e.id === levantadoPorId)?.nome ||
      "";
    if (!nome) {
      setErro("Indique quem levantou a criança.");
      return;
    }
    setAGuardar(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("presencas")
      .update({
        hora_saida: new Date().toISOString(),
        levantado_por_id: levantadoPorId || null,
        levantado_por_nome: nome,
        registado_saida_por: perfilId,
      })
      .eq("id", presenca!.id);
    setAGuardar(false);
    if (error) {
      setErro("Não foi possível registar a saída.");
      return;
    }
    router.refresh();
  }

  if (!presenca || !presenca.hora_entrada) {
    return (
      <div className="flex items-center gap-2">
        {erro && <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={registarEntrada}
          disabled={aGuardar}
          className={BOTAO_PRIMARIO}
        >
          {aGuardar ? "A registar…" : "Registar entrada"}
        </motion.button>
      </div>
    );
  }

  if (presenca.hora_saida) {
    return (
      <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
        Saiu às {formatarHoraPT(presenca.hora_saida)} · levantado por{" "}
        {presenca.levantado_por_nome}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="flex items-center gap-1.5 text-sm text-brand-positive dark:text-brand-positive">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-positive" />
        Presente desde {formatarHoraPT(presenca.hora_entrada)}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {!aRegistarSaida ? (
          <motion.button
            key="abrir"
            whileTap={{ scale: 0.96 }}
            onClick={() => setARegistarSaida(true)}
            className={BOTAO_SECUNDARIO}
          >
            Registar saída
          </motion.button>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-end gap-2 overflow-hidden rounded-xl border border-brand-border p-3 dark:border-brand-border-dark"
          >
            <p className="text-xs text-brand-muted dark:text-brand-muted-dark">
              Quem levantou a criança?
            </p>
            {encarregados.length > 0 && (
              <select
                value={levantadoPorId}
                onChange={(e) => {
                  setLevantadoPorId(e.target.value);
                  setLevantadoPorNome("");
                }}
                className={`${CAMPO} w-56 py-1.5`}
              >
                <option value="">— Escolher —</option>
                {encarregados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
            )}
            <input
              value={levantadoPorNome}
              onChange={(e) => {
                setLevantadoPorNome(e.target.value);
                setLevantadoPorId("");
              }}
              placeholder="Ou escreva o nome (ex.: outra pessoa autorizada)"
              className={`${CAMPO} w-56 py-1.5`}
            />
            {erro && (
              <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>
            )}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={registarSaida}
              disabled={aGuardar}
              className={BOTAO_PRIMARIO}
            >
              {aGuardar ? "A registar…" : "Confirmar saída"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
