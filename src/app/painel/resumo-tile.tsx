const CORES = {
  meal: {
    bg: "bg-tile-meal-soft dark:bg-tile-meal-soft-dark",
    texto: "text-tile-meal",
  },
  sleep: {
    bg: "bg-tile-sleep-soft dark:bg-tile-sleep-soft-dark",
    texto: "text-tile-sleep",
  },
  diaper: {
    bg: "bg-tile-diaper-soft dark:bg-tile-diaper-soft-dark",
    texto: "text-tile-diaper",
  },
  photo: {
    bg: "bg-tile-photo-soft dark:bg-tile-photo-soft-dark",
    texto: "text-tile-photo",
  },
} as const;

/** Um "azulejo" do resumo do dia — refeição, sesta, fraldas, fotos. */
export function ResumoTile({
  tipo,
  emoji,
  rotulo,
  valor,
}: {
  tipo: keyof typeof CORES;
  emoji: string;
  rotulo: string;
  valor: string;
}) {
  const cor = CORES[tipo];
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-brand-border bg-brand-surface p-3 text-center dark:border-brand-border-dark dark:bg-brand-surface-dark">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full text-base ${cor.bg} ${cor.texto}`}
      >
        {emoji}
      </span>
      <span className="text-[11px] font-medium text-brand-muted dark:text-brand-muted-dark">
        {rotulo}
      </span>
      <span className="text-xs font-semibold text-brand-ink dark:text-brand-ink-dark">
        {valor}
      </span>
    </div>
  );
}
