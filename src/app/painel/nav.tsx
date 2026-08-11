import Link from "next/link";

export function PainelNav({
  contagemNaoLidas = 0,
}: {
  contagemNaoLidas?: number;
}) {
  return (
    <nav className="flex items-center gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
      <Link
        href="/painel"
        className="transition-colors hover:text-black dark:hover:text-zinc-50"
      >
        Início
      </Link>
      <Link
        href="/painel/mural"
        className="transition-colors hover:text-black dark:hover:text-zinc-50"
      >
        Mural
      </Link>
      <Link
        href="/painel/mensagens"
        className="flex items-center gap-1.5 transition-colors hover:text-black dark:hover:text-zinc-50"
      >
        Mensagens
        {contagemNaoLidas > 0 && (
          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
            {contagemNaoLidas}
          </span>
        )}
      </Link>
    </nav>
  );
}
