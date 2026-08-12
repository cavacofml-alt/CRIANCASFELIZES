"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { formatarDataPT } from "@/lib/data";
import { CAMPO, BOTAO_PRIMARIO } from "../estilos";

type Documento = {
  id: string;
  caminho: string;
  nome_ficheiro: string;
  criado_em: string;
};

const DIACRITICOS = new RegExp(
  "[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]",
  "g",
);
function caminhoSeguro(nomeFicheiro: string) {
  return nomeFicheiro
    .normalize("NFD")
    .replace(DIACRITICOS, "")
    .replace(/[^a-zA-Z0-9.]/g, "-");
}

export function DocumentosCrianca({
  escolaId,
  criancaId,
  perfilId,
  documentos,
}: {
  escolaId: string;
  criancaId: string;
  perfilId: string;
  documentos: Documento[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    const ficheiro = inputRef.current?.files?.[0];
    if (!ficheiro) return;
    setAEnviar(true);
    setErro(null);
    const supabase = createClient();
    const nomeSeguro = caminhoSeguro(ficheiro.name);
    const caminho = `${escolaId}/${criancaId}/${Date.now()}-${nomeSeguro}`;
    const { error: errUpload } = await supabase.storage
      .from("documentos-criancas")
      .upload(caminho, ficheiro, { contentType: ficheiro.type });
    if (errUpload) {
      setAEnviar(false);
      setErro("Não foi possível enviar o documento.");
      return;
    }
    const { error: errInsert } = await supabase.from("documentos_crianca").insert({
      escola_id: escolaId,
      crianca_id: criancaId,
      caminho,
      nome_ficheiro: ficheiro.name,
      autor_id: perfilId,
    });
    setAEnviar(false);
    if (errInsert) {
      await supabase.storage.from("documentos-criancas").remove([caminho]);
      setErro("Não foi possível guardar o documento.");
      return;
    }
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  async function transferir(caminho: string, nomeFicheiro: string) {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("documentos-criancas")
      .createSignedUrl(caminho, 60);
    if (data?.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = nomeFicheiro;
      a.click();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {documentos.length > 0 ? (
        <ul className="flex flex-col divide-y divide-brand-border dark:divide-brand-border-dark">
          {documentos.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="text-brand-ink dark:text-brand-ink-dark">
                {d.nome_ficheiro}
                <span className="text-brand-muted dark:text-brand-muted-dark">
                  {" "}
                  · {formatarDataPT(d.criado_em)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => transferir(d.caminho, d.nome_ficheiro)}
                className="text-xs text-brand-accent hover:underline"
              >
                Abrir
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
          Ainda não há documentos.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input ref={inputRef} type="file" className={CAMPO} />
        <motion.button
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={enviar}
          disabled={aEnviar}
          className={`self-start ${BOTAO_PRIMARIO}`}
        >
          {aEnviar ? "A enviar…" : "Enviar documento"}
        </motion.button>
      </div>
      {erro && <p className="text-xs text-red-600 dark:text-red-400">{erro}</p>}
    </div>
  );
}
