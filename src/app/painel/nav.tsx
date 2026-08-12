"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function Badge({ contagem }: { contagem: number }) {
  if (contagem <= 0) return null;
  return (
    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
      {contagem}
    </span>
  );
}

const LIGACOES = [
  { href: "/painel", rotulo: "Início", icone: "🏠" },
  { href: "/painel/mural", rotulo: "Mural", icone: "📌", contagem: "avisos" as const },
  { href: "/painel/presencas", rotulo: "Presenças", icone: "✅" },
  { href: "/painel/relatorios", rotulo: "Relatórios", icone: "📋" },
  { href: "/painel/fotos", rotulo: "Fotos", icone: "📷" },
  {
    href: "/painel/mensagens",
    rotulo: "Mensagens",
    icone: "💬",
    contagem: "mensagens" as const,
  },
];

export function PainelNav({
  contagemAvisos = 0,
  contagemMensagens = 0,
}: {
  contagemAvisos?: number;
  contagemMensagens?: number;
}) {
  const pathname = usePathname();
  const contagens = { avisos: contagemAvisos, mensagens: contagemMensagens };

  return (
    <nav className="flex items-center gap-1 overflow-x-auto text-sm font-medium text-brand-muted dark:text-brand-muted-dark">
      {LIGACOES.map((l) => {
        const ativo =
          l.href === "/painel" ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
              ativo
                ? "bg-brand-accent-soft font-semibold text-brand-accent dark:bg-brand-accent-soft-dark"
                : "hover:text-brand-ink dark:hover:text-brand-ink-dark"
            }`}
          >
            <span aria-hidden="true">{l.icone}</span>
            <span>{l.rotulo}</span>
            {l.contagem && <Badge contagem={contagens[l.contagem]} />}
          </Link>
        );
      })}
    </nav>
  );
}
