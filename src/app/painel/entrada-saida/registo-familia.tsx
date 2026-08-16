"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { formatarHoraPT } from "@/lib/data";
import { CAMPO, BOTAO_PRIMARIO, BOTAO_SECUNDARIO } from "../estilos";
import { Avatar } from "../avatar";

type Presenca = {
  id: string;
  hora_entrada: string | null;
  hora_saida: string | null;
  levantado_por_nome: string | null;
} | null;

export function RegistoFamilia({
  escolaId,
  criancaId,
  criancaNome,
  fotoUrl,
  data,
  perfilId,
  perfilNome,
  presenca,
  autorizados,
}: {
  escolaId: string;
  criancaId: string;
  criancaNome: string;
  fotoUrl: string | null;
  data: string;
  perfilId: string;
  perfilNome: string;
  presenca: Presenca;
  autorizados: { nome: string }[];
}) {
  const router = useRouter();
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aRegistarSaida, setARegistarSaida] = useState(false);
  const [quemLevanta, setQuemLevanta] = useState(perfilNome);
  const [outroNome, setOutroNome] = useState("");

  const opcoesLevantamento = [perfilNome, ...autorizados.map((a) => a.nome), "Outra pessoa…"];

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
      setErro("Não foi possível registar a entrada. Tente novamente ou fale com a equipa.");
      return;
    }
    router.refresh();
  }

  async function registarSaida() {
    const nome = quemLevanta === "Outra pessoa…" ? outroNome.trim() : quemLevanta;
    if (!nome) {
      setErro("Indique quem vai levantar a criança.");
      return;
    }
    setAGuardar(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("presencas")
      .update({
        hora_saida: new Date().toISOString(),
        levantado_por_id: null,
        levantado_por_nome: nome,
        registado_saida_por: perfilId,
      })
      .eq("id", presenca!.id);
    setAGuardar(false);
    if (error) {
      setErro("Não foi possível registar a saída. Tente novamente ou fale com a equipa.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-brand-border bg-brand-surface p-5 dark:border-brand-border-dark dark:bg-brand-surface-dark">
      <div className="flex items-center gap-3">
        <Avatar nome={criancaNome} src={fotoUrl} tamanho="lg" />
        <div>
          <h2 className="text-lg font-semibold text-brand-ink dark:text-brand-ink-dark">
            {criancaNome}
          </h2>
          {presenca?.hora_entrada && !presenca.hora_saida && (
            <p className="flex items-center gap-1.5 text-sm text-brand-positive">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-positive" />
              Na creche desde {formatarHoraPT(presenca.hora_entrada)}
            </p>
          )}
          {presenca?.hora_saida && (
            <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
              Saiu às {formatarHoraPT(presenca.hora_saida)} · levantada(o) por{" "}
              {presenca.levantado_por_nome}
            </p>
          )}
          {!presenca?.hora_entrada && (
            <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
              Ainda não deu entrada hoje
            </p>
          )}
        </div>
      </div>

      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

      {!presenca?.hora_entrada && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={registarEntrada}
          disabled={aGuardar}
          className={`self-start ${BOTAO_PRIMARIO}`}
        >
          {aGuardar ? "A registar…" : "Registar entrada"}
        </motion.button>
      )}

      {presenca?.hora_entrada && !presenca.hora_saida && !aRegistarSaida && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setARegistarSaida(true)}
          className={`self-start ${BOTAO_SECUNDARIO}`}
        >
          Registar saída
        </motion.button>
      )}

      {presenca?.hora_entrada && !presenca.hora_saida && aRegistarSaida && (
        <div className="flex flex-col gap-2 rounded-xl border border-brand-border p-3 dark:border-brand-border-dark">
          <p className="text-xs text-brand-muted dark:text-brand-muted-dark">
            Quem vai levantar a criança?
          </p>
          <select
            value={quemLevanta}
            onChange={(e) => setQuemLevanta(e.target.value)}
            className={`${CAMPO} w-full`}
          >
            {opcoesLevantamento.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
          {quemLevanta === "Outra pessoa…" && (
            <input
              value={outroNome}
              onChange={(e) => setOutroNome(e.target.value)}
              placeholder="Nome de quem vai levantar"
              className={CAMPO}
            />
          )}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={registarSaida}
            disabled={aGuardar}
            className={`self-start ${BOTAO_PRIMARIO}`}
          >
            {aGuardar ? "A registar…" : "Confirmar saída"}
          </motion.button>
        </div>
      )}
    </div>
  );
}
