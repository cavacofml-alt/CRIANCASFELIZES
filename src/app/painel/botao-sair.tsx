"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function BotaoSair() {
  const router = useRouter();

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={sair}
      className="shrink-0 rounded-full border border-brand-border px-3 py-1.5 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-accent-soft hover:text-brand-ink dark:border-brand-border-dark dark:text-brand-muted-dark dark:hover:bg-brand-accent-soft-dark dark:hover:text-brand-ink-dark"
    >
      Sair
    </button>
  );
}
