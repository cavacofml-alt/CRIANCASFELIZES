import Link from "next/link";

function Badge({ contagem }: { contagem: number }) {
  if (contagem <= 0) return null;
  return (
    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
      {contagem}
    </span>
  );
}

export function PainelNav({
  contagemAvisos = 0,
  contagemMensagens = 0,
}: {
  contagemAvisos?: number;
  contagemMensagens?: number;
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
        className="flex items-center gap-1.5 transition-colors hover:text-black dark:hover:text-zinc-50"
      >
        Mural
        <Badge contagem={contagemAvisos} />
      </Link>
      <Link
        href="/painel/presencas"
        className="transition-colors hover:text-black dark:hover:text-zinc-50"
      >
        Presenças
      </Link>
      <Link
        href="/painel/relatorios"
        className="transition-colors hover:text-black dark:hover:text-zinc-50"
      >
        Relatórios
      </Link>
      <Link
        href="/painel/fotos"
        className="transition-colors hover:text-black dark:hover:text-zinc-50"
      >
        Fotos
      </Link>
      <Link
        href="/painel/mensagens"
        className="flex items-center gap-1.5 transition-colors hover:text-black dark:hover:text-zinc-50"
      >
        Mensagens
        <Badge contagem={contagemMensagens} />
      </Link>
    </nav>
  );
}
