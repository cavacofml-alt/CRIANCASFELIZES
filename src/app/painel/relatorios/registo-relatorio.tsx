"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CAMPO =
  "rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

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
      <button
        onClick={() => setAberto(true)}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {relatorio ? `Editar (${resumo || "preenchido"})` : "Preencher relatório"}
      </button>
    );
  }

  return (
    <form
      onSubmit={guardar}
      className="flex w-full flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
    >
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Pequeno-almoço
          <select
            value={pequenoAlmoco}
            onChange={(e) => setPequenoAlmoco(e.target.value)}
            className={CAMPO}
          >
            {OPCOES_REFEICAO.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Almoço
          <select
            value={almoco}
            onChange={(e) => setAlmoco(e.target.value)}
            className={CAMPO}
          >
            {OPCOES_REFEICAO.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Lanche
          <select
            value={lanche}
            onChange={(e) => setLanche(e.target.value)}
            className={CAMPO}
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
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Sesta — início
          <input
            type="time"
            value={sonoInicio}
            onChange={(e) => setSonoInicio(e.target.value)}
            className={CAMPO}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Sesta — fim
          <input
            type="time"
            value={sonoFim}
            onChange={(e) => setSonoFim(e.target.value)}
            className={CAMPO}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Fraldas trocadas
          <input
            type="number"
            min={0}
            value={fraldas}
            onChange={(e) => setFraldas(Number(e.target.value))}
            className={CAMPO}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs text-zinc-500">
        Notas
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          className={CAMPO}
        />
      </label>

      {erro && <p className="text-xs text-red-600">{erro}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={aGuardar}
          className="rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
        >
          {aGuardar ? "A guardar…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
