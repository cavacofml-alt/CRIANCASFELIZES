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

type Ligacao = {
  href: string;
  rotulo: string;
  icone: string;
  contagem?: "avisos" | "mensagens" | "comunicacao";
};

// A família vê uma navegação orientada ao que interessa a um encarregado
// de educação (o dia da criança, os momentos, falar com a escola, o
// perfil da criança). Mural e o histórico de relatórios continuam
// acessíveis — por um link dentro de "Hoje"/"Comunicação" — só deixam de
// ocupar um lugar fixo na barra.
const LIGACOES_ENCARREGADO: Ligacao[] = [
  { href: "/painel", rotulo: "Hoje", icone: "🏠" },
  { href: "/painel/fotos", rotulo: "Momentos", icone: "📸" },
  { href: "/painel/mensagens", rotulo: "Comunicação", icone: "💬", contagem: "comunicacao" },
  { href: "/painel/perfil", rotulo: "Perfil", icone: "👤" },
];

// Staff/admin mantêm a navegação operacional de sempre, com "Registar"
// como novo ponto de entrada para o registo rápido, de um toque, por
// criança.
const LIGACOES_EQUIPA: Ligacao[] = [
  { href: "/painel", rotulo: "Início", icone: "🏠" },
  { href: "/painel/registar", rotulo: "Registar", icone: "⚡" },
  { href: "/painel/mural", rotulo: "Mural", icone: "📌", contagem: "avisos" },
  { href: "/painel/presencas", rotulo: "Presenças", icone: "✅" },
  { href: "/painel/relatorios", rotulo: "Relatórios", icone: "📋" },
  { href: "/painel/fotos", rotulo: "Fotos", icone: "📷" },
  { href: "/painel/mensagens", rotulo: "Mensagens", icone: "💬", contagem: "mensagens" },
];

export function PainelNav({
  papel,
  contagemAvisos = 0,
  contagemMensagens = 0,
}: {
  papel?: "admin" | "staff" | "encarregado";
  contagemAvisos?: number;
  contagemMensagens?: number;
}) {
  const pathname = usePathname();
  const contagens = {
    avisos: contagemAvisos,
    mensagens: contagemMensagens,
    comunicacao: contagemAvisos + contagemMensagens,
  };
  const ligacoes = papel === "encarregado" ? LIGACOES_ENCARREGADO : LIGACOES_EQUIPA;

  return (
    <nav className="flex items-center gap-1 overflow-x-auto text-sm font-medium text-brand-muted dark:text-brand-muted-dark">
      {ligacoes.map((l) => {
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
