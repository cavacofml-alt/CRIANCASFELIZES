"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const BOTAO =
  "shrink-0 rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-50 dark:text-black";

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
        {erro && <p className="text-xs text-red-600">{erro}</p>}
        <button onClick={registarEntrada} disabled={aGuardar} className={BOTAO}>
          {aGuardar ? "A registar…" : "Registar entrada"}
        </button>
      </div>
    );
  }

  if (presenca.hora_saida) {
    return (
      <p className="text-sm text-zinc-500">
        Saiu às{" "}
        {new Date(presenca.hora_saida).toLocaleTimeString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        · levantado por {presenca.levantado_por_nome}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Presente desde{" "}
        {new Date(presenca.hora_entrada).toLocaleTimeString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      {!aRegistarSaida ? (
        <button
          onClick={() => setARegistarSaida(true)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Registar saída
        </button>
      ) : (
        <div className="flex flex-col items-end gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">Quem levantou a criança?</p>
          {encarregados.length > 0 && (
            <select
              value={levantadoPorId}
              onChange={(e) => {
                setLevantadoPorId(e.target.value);
                setLevantadoPorNome("");
              }}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
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
            className="w-56 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <button onClick={registarSaida} disabled={aGuardar} className={BOTAO}>
            {aGuardar ? "A registar…" : "Confirmar saída"}
          </button>
        </div>
      )}
    </div>
  );
}
