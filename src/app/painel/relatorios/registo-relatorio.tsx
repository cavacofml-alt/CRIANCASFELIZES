"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { CAMPO, BOTAO_PRIMARIO, BOTAO_SECUNDARIO } from "../estilos";

const OPCOES_REFEICAO = [
  { valor: "", etiqueta: "—" },
  { valor: "nao_comeu", etiqueta: "Não comeu" },
  { valor: "comeu_pouco", etiqueta: "Comeu pouco" },
  { valor: "comeu_metade", etiqueta: "Comeu metade" },
  { valor: "comeu_tudo", etiqueta: "Comeu tudo" },
] as const;

type Relatorio = {
  id: string;
  pequeno_almoco: string | null;
  almoco: string | null;
  lanche: string | null;
  sono_inicio: string | null;
  sono_fim: string | null;
  fraldas_trocadas: number;
  notas: string | null;
};

export function RegistoRelatorio({
  escolaId,
  criancaId,
  data,
  perfilId,
  relatorio,
}: {
  escolaId: string;
  criancaId: string;
  data: string;
  perfilId: string;
  relatorio: Relatorio | null;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [pequenoAlmoco, setPequenoAlmoco] = useState(
    relatorio?.pequeno_almoco ?? "",
  );
  const [almoco, setAlmoco] = useState(relatorio?.almoco ?? "");
  const [lanche, setLanche] = useState(relatorio?.lanche ?? "");
  const [sonoInicio, setSonoInicio] = useState(relatorio?.sono_inicio ?? "");
  const [sonoFim, setSonoFim] = useState(relatorio?.sono_fim ?? "");
  const [fraldas, setFraldas] = useState(relatorio?.fraldas_trocadas ?? 0);
  const [notas, setNotas] = useState(relatorio?.notas ?? "");

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setAGuardar(true);
    setErro(null);
    const supabase = createClient();
    const valores = {
      pequeno_almoco: pequenoAlmoco || null,
      almoco: almoco || null,
      lanche: lanche || null,
      sono_inicio: sonoInicio || null,
      sono_fim: sonoFim || null,
      fraldas_trocadas: fraldas,
      notas: notas.trim() || null,
    };

    const { error } = relatorio
      ? await supabase
          .from("relatorios_diarios")
          .update(valores)
          .eq("id", relatorio.id)
      : await supabase.from("relatorios_diarios").insert({
          escola_id: escolaId,
          crianca_id: criancaId,
          data,
          registado_por: perfilId,
          ...valores,
        });

    setAGuardar(false);
    if (error) {
      setErro("Não foi possível guardar o relatório.");
      return;
    }
    setAberto(false);
    router.refresh();
  }

  if (!aberto) {
    const resumo = [
      pequenoAlmoco && "pequeno-almoço",
      almoco && "almoço",
      lanche && "lanche",
      sonoInicio && "sesta",
    ]
      .filter(Boolean)
      .join(", ");

    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setAberto(true)}
        className={`self-start ${BOTAO_SECUNDARIO}`}
      >
        {relatorio ? `Editar (${resumo || "preenchido"})` : "Preencher relatório"}
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.form
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ duration: 0.2 }}
        onSubmit={guardar}
        className="flex w-full flex-col gap-3 overflow-hidden rounded-xl border border-brand-border p-3 dark:border-brand-border-dark"
      >
        <div className="grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1 text-xs text-brand-muted dark:text-brand-muted-dark">
            Pequeno-almoço
            <select
              value={pequenoAlmoco}
              onChange={(e) => setPequenoAlmoco(e.target.value)}
              className={`${CAMPO} py-1.5`}
            >
              {OPCOES_REFEICAO.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-brand-muted dark:text-brand-muted-dark">
            Almoço
            <select
              value={almoco}
              onChange={(e) => setAlmoco(e.target.value)}
              className={`${CAMPO} py-1.5`}
            >
              {OPCOES_REFEICAO.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-brand-muted dark:text-brand-muted-dark">
            Lanche
            <select
              value={lanche}
              onChange={(e) => setLanche(e.target.value)}
              className={`${CAMPO} py-1.5`}
            >
              {OPCOES_REFEICAO.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1 text-xs text-brand-muted dark:text-brand-muted-dark">
            Sesta — início
            <input
              type="time"
              value={sonoInicio}
              onChange={(e) => setSonoInicio(e.target.value)}
              className={`${CAMPO} py-1.5`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-brand-muted dark:text-brand-muted-dark">
            Sesta — fim
            <input
              type="time"
              value={sonoFim}
              onChange={(e) => setSonoFim(e.target.value)}
              className={`${CAMPO} py-1.5`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-brand-muted dark:text-brand-muted-dark">
            Fraldas trocadas
            <input
              type="number"
              min={0}
              value={fraldas}
              onChange={(e) => setFraldas(Number(e.target.value))}
              className={`${CAMPO} py-1.5`}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs text-brand-muted dark:text-brand-muted-dark">
          Notas
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className={CAMPO}
          />
        </label>

        {erro && <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>}

        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={aGuardar}
            className={BOTAO_PRIMARIO}
          >
            {aGuardar ? "A guardar…" : "Guardar"}
          </motion.button>
          <button
            type="button"
            onClick={() => setAberto(false)}
            className={BOTAO_SECUNDARIO}
          >
            Cancelar
          </button>
        </div>
      </motion.form>
    </AnimatePresence>
  );
}
