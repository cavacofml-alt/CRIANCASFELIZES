"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "../../avatar";

export function AvatarUpload({
  escolaId,
  criancaId,
  nome,
  fotoUrl,
}: {
  escolaId: string;
  criancaId: string;
  nome: string;
  fotoUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function alterar() {
    inputRef.current?.click();
  }

  async function aoEscolher() {
    const ficheiro = inputRef.current?.files?.[0];
    if (!ficheiro) return;
    setAEnviar(true);
    setErro(null);
    const supabase = createClient();
    const extensao = ficheiro.name.split(".").pop() ?? "png";
    const caminho = `${escolaId}/${criancaId}/avatar.${extensao}`;
    const { error: errUpload } = await supabase.storage
      .from("avatares-criancas")
      .upload(caminho, ficheiro, { contentType: ficheiro.type, upsert: true });
    if (errUpload) {
      setAEnviar(false);
      setErro("Não foi possível enviar a foto.");
      return;
    }
    const { error: errUpdate } = await supabase
      .from("criancas")
      .update({ foto_caminho: caminho })
      .eq("id", criancaId);
    setAEnviar(false);
    if (errUpdate) {
      setErro("Não foi possível guardar a foto.");
      return;
    }
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar nome={nome} src={fotoUrl} tamanho="xl" />
      <div className="flex flex-col gap-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={aoEscolher}
        />
        <motion.button
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={alterar}
          disabled={aEnviar}
          className="self-start rounded-full border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-muted transition-colors hover:bg-brand-accent-soft hover:text-brand-ink dark:border-brand-border-dark dark:text-brand-muted-dark dark:hover:bg-brand-accent-soft-dark dark:hover:text-brand-ink-dark"
        >
          {aEnviar ? "A enviar…" : fotoUrl ? "Alterar foto" : "+ Adicionar foto"}
        </motion.button>
        {erro && <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>}
      </div>
    </div>
  );
}
