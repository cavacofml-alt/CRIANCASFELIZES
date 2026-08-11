/**
 * Cor de identidade por turma — não depende do nome da turma (uma
 * escola real pode chamar-lhes o que quiser), só da posição na lista
 * ordenada por nome. Serve para distinguir turmas visualmente (tags no
 * mural, por exemplo), não é decoração aleatória.
 */
const PALETA_TURMAS = [
  { bg: "bg-rose-50 dark:bg-rose-950/40", texto: "text-rose-700 dark:text-rose-300" },
  { bg: "bg-amber-50 dark:bg-amber-950/40", texto: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-teal-50 dark:bg-teal-950/40", texto: "text-teal-700 dark:text-teal-300" },
  { bg: "bg-violet-50 dark:bg-violet-950/40", texto: "text-violet-700 dark:text-violet-300" },
  { bg: "bg-sky-50 dark:bg-sky-950/40", texto: "text-sky-700 dark:text-sky-300" },
] as const;

export function corTurma(indice: number) {
  return PALETA_TURMAS[indice % PALETA_TURMAS.length];
}

/** Constrói um mapa turma_id -> índice, a partir de uma lista já ordenada. */
export function indicePorTurma(turmas: { id: string }[]) {
  return new Map(turmas.map((t, i) => [t.id, i]));
}
