import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EntradaAnimada } from "./entrada-animada";

export default async function Home() {
  const supabase = await createClient();
  const { error } = await supabase.auth.getSession();
  const connected = !error;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-bg font-sans dark:bg-brand-bg-dark">
      <EntradaAnimada>
        <main className="flex flex-col items-center gap-6 px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-brand-ink dark:text-brand-ink-dark">
            Crianças Felizes
          </h1>
          <p className="max-w-md text-lg text-brand-muted dark:text-brand-muted-dark">
            Comunicação, presenças e relatórios diários entre a creche e a
            família.
          </p>
          <Link
            href="/login"
            className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover"
          >
            Entrar
          </Link>
          <div
            className={`rounded-full px-4 py-2 text-xs font-medium ${
              connected
                ? "bg-brand-positive-soft text-brand-positive dark:bg-brand-positive-soft-dark"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {connected ? "✓ Ligado ao Supabase" : "✗ Falha na ligação ao Supabase"}
          </div>
        </main>
      </EntradaAnimada>
    </div>
  );
}
