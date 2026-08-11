"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ApagarFotoBotao({
  fotoId,
  caminho,
}: {
  fotoId: string;
  caminho: string;
}) {
  const router = useRouter();
  const [aApagar, setAApagar] = useState(false);

  async function apagar() {
    if (!confirm("Apagar esta foto?")) return;
    setAApagar(true);
    const supabase = createClient();
    await supabase.storage.from("fotos-turmas").remove([caminho]);
    await supabase.from("fotos").delete().eq("id", fotoId);
    setAApagar(false);
    router.refresh();
  }

  return (
    <button
      onClick={apagar}
      disabled={aApagar}
      className="rounded-full bg-black/55 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/75 disabled:opacity-50"
    >
      {aApagar ? "…" : "Apagar"}
    </button>
  );
}
