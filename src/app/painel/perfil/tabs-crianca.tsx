"use client";

import { useState, type ReactNode } from "react";

const SEPARADORES = [
  { id: "informacoes", rotulo: "Informações" },
  { id: "saude", rotulo: "Saúde" },
  { id: "responsaveis", rotulo: "Responsáveis" },
  { id: "documentos", rotulo: "Documentos" },
] as const;

type SeparadorId = (typeof SEPARADORES)[number]["id"];

export function TabsCrianca({
  informacoes,
  saude,
  responsaveis,
  documentos,
}: Record<SeparadorId, ReactNode>) {
  const [ativo, setAtivo] = useState<SeparadorId>("informacoes");
  const conteudo: Record<SeparadorId, ReactNode> = {
    informacoes,
    saude,
    responsaveis,
    documentos,
  };

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-brand-border pb-2 dark:border-brand-border-dark">
        {SEPARADORES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setAtivo(s.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              ativo === s.id
                ? "bg-brand-accent-soft text-brand-accent dark:bg-brand-accent-soft-dark"
                : "text-brand-muted hover:text-brand-ink dark:text-brand-muted-dark dark:hover:text-brand-ink-dark"
            }`}
          >
            {s.rotulo}
          </button>
        ))}
      </div>
      <div className="pt-4">{conteudo[ativo]}</div>
    </div>
  );
}
