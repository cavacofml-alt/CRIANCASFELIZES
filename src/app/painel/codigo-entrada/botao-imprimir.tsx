"use client";

export function BotaoImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="mt-4 rounded-full bg-brand-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover print:hidden"
    >
      Imprimir
    </button>
  );
}
