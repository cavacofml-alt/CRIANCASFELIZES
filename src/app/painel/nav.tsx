"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

function Badge({ contagem }: { contagem: number }) {
  if (contagem <= 0) return null;
  return (
    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
      {contagem}
    </span>
  );
}

const LIGACOES = [
  { href: "/painel", rotulo: "Início" },
  { href: "/painel/mural", rotulo: "Mural", contagem: "avisos" as const },
  { href: "/painel/presencas", rotulo: "Presenças" },
  { href: "/painel/relatorios", rotulo: "Relatórios" },
  { href: "/painel/fotos", rotulo: "Fotos" },
  { href: "/painel/mensagens", rotulo: "Mensagens", contagem: "mensagens" as const },
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
            className="relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:text-brand-ink dark:hover:text-brand-ink-dark"
          >
            {ativo && (
              <motion.span
                layoutId="painel-nav-ativo"
                className="absolute inset-0 rounded-full bg-brand-accent-soft dark:bg-brand-accent-soft-dark"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span
              className={`relative ${ativo ? "font-semibold text-brand-accent" : ""}`}
            >
              {l.rotulo}
            </span>
            {l.contagem && (
              <span className="relative">
                <Badge contagem={contagens[l.contagem]} />
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
