function iniciaisDe(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const TAMANHOS = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-20 w-20 text-2xl",
} as const;

export function Avatar({
  nome,
  src,
  tamanho = "md",
}: {
  nome: string;
  src?: string | null;
  tamanho?: keyof typeof TAMANHOS;
}) {
  const classes = `shrink-0 rounded-full ${TAMANHOS[tamanho]}`;

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- URL assinada temporária, não vale a pena o pipeline de otimização do Next para isto.
    return <img src={src} alt={nome} className={`${classes} object-cover`} />;
  }

  return (
    <div
      className={`${classes} flex items-center justify-center bg-brand-accent-soft font-semibold text-brand-accent dark:bg-brand-accent-soft-dark`}
      aria-hidden="true"
    >
      {iniciaisDe(nome) || "?"}
    </div>
  );
}
