import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { error } = await supabase.auth.getSession();
  const connected = !error;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
          Crianças Felizes
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Aplicação de gestão de creches/escolas — em construção.
        </p>
        <div
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            connected
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {connected ? "✓ Ligado ao Supabase" : "✗ Falha na ligação ao Supabase"}
        </div>
      </main>
    </div>
  );
}
