"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { CAMPO, BOTAO_PRIMARIO, BOTAO_SECUNDARIO } from "../../estilos";

const OPCOES_REFEICAO = [
  { valor: "nao_comeu", etiqueta: "Não comeu" },
  { valor: "comeu_pouco", etiqueta: "Comeu pouco" },
  { valor: "comeu_metade", etiqueta: "Comeu metade" },
  { valor: "comeu_tudo", etiqueta: "Comeu tudo" },
] as const;

type Relatorio = {
  id: string;
  pequeno_almoco: string | null;
  almoco: string | null;
  lanche: string | null;
  sono_inicio: string | null;
  sono_fim: string | null;
  fraldas_trocadas: number;
  notas: string | null;
};

type Acao = "refeicao" | "sesta" | "higiene" | "foto" | "observacao" | "desenvolvimento";

const ACOES: { chave: Acao; icone: string; rotulo: string }[] = [
  { chave: "refeicao", icone: "🍎", rotulo: "Refeição" },
  { chave: "sesta", icone: "😴", rotulo: "Sesta" },
  { chave: "higiene", icone: "🧷", rotulo: "Higiene" },
  { chave: "foto", icone: "📷", rotulo: "Fotografia" },
  { chave: "observacao", icone: "📝", rotulo: "Observação" },
  { chave: "desenvolvimento", icone: "❤️", rotulo: "Desenvolvimento" },
];

const OPCOES_CATEGORIA = [
  { valor: "motor", etiqueta: "Motor" },
  { valor: "linguagem", etiqueta: "Linguagem" },
  { valor: "social", etiqueta: "Social" },
  { valor: "cognitivo", etiqueta: "Cognitivo" },
  { valor: "autonomia", etiqueta: "Autonomia" },
] as const;

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

function horaAgora() {
  return new Date().toTimeString().slice(0, 5);
}

export function RegistoRapido({
  escolaId,
  criancaId,
  turmaId,
  data,
  perfilId,
  relatorio,
}: {
  escolaId: string;
  criancaId: string;
  turmaId: string | null;
  data: string;
  perfilId: string;
  relatorio: Relatorio | null;
}) {
  const router = useRouter();
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const [aberto, setAberto] = useState<Acao | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState<Acao | null>(null);

  const [pequenoAlmoco, setPequenoAlmoco] = useState(relatorio?.pequeno_almoco ?? "");
  const [almoco, setAlmoco] = useState(relatorio?.almoco ?? "");
  const [lanche, setLanche] = useState(relatorio?.lanche ?? "");
  const [sonoInicio, setSonoInicio] = useState(relatorio?.sono_inicio?.slice(0, 5) ?? "");
  const [sonoFim, setSonoFim] = useState(relatorio?.sono_fim?.slice(0, 5) ?? "");
  const [fraldas, setFraldas] = useState(relatorio?.fraldas_trocadas ?? 0);
  const [notas, setNotas] = useState(relatorio?.notas ?? "");

  const [categoriaMarco, setCategoriaMarco] = useState<string>("");
  const [tituloMarco, setTituloMarco] = useState("");

  function assinalarFeito(acao: Acao) {
    setFeito(acao);
    window.setTimeout(() => setFeito((atual) => (atual === acao ? null : atual)), 1200);
  }

  async function guardarRelatorio(campos: Record<string, unknown>) {
    setAGuardar(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.from("relatorios_diarios").upsert(
      {
        escola_id: escolaId,
        crianca_id: criancaId,
        data,
        registado_por: perfilId,
        pequeno_almoco: pequenoAlmoco || null,
        almoco: almoco || null,
        lanche: lanche || null,
        sono_inicio: sonoInicio || null,
        sono_fim: sonoFim || null,
        fraldas_trocadas: fraldas,
        notas: notas.trim() || null,
        ...campos,
      },
      { onConflict: "crianca_id,data" },
    );
    setAGuardar(false);
    if (error) {
      setErro("Não foi possível guardar.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function tocarRefeicao(campo: "pequeno_almoco" | "almoco" | "lanche", valor: string) {
    const atual = { pequeno_almoco: pequenoAlmoco, almoco, lanche };
    const novoValor = atual[campo] === valor ? "" : valor;
    if (campo === "pequeno_almoco") setPequenoAlmoco(novoValor);
    if (campo === "almoco") setAlmoco(novoValor);
    if (campo === "lanche") setLanche(novoValor);
    const ok = await guardarRelatorio({ [campo]: novoValor || null });
    if (ok) assinalarFeito("refeicao");
  }

  async function iniciarSesta() {
    const hora = horaAgora();
    setSonoInicio(hora);
    const ok = await guardarRelatorio({ sono_inicio: hora, sono_fim: null });
    if (ok) assinalarFeito("sesta");
  }

  async function terminarSesta() {
    const hora = horaAgora();
    setSonoFim(hora);
    const ok = await guardarRelatorio({ sono_fim: hora });
    if (ok) assinalarFeito("sesta");
  }

  async function maisUmaFralda() {
    const novo = fraldas + 1;
    setFraldas(novo);
    const ok = await guardarRelatorio({ fraldas_trocadas: novo });
    if (ok) assinalarFeito("higiene");
  }

  async function guardarMarco() {
    if (!categoriaMarco || !tituloMarco.trim()) {
      setErro("Escolha uma categoria e escreva um título.");
      return;
    }
    setAGuardar(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.from("marcos_desenvolvimento").insert({
      escola_id: escolaId,
      crianca_id: criancaId,
      categoria: categoriaMarco,
      titulo: tituloMarco.trim(),
      registado_por: perfilId,
    });
    setAGuardar(false);
    if (error) {
      setErro("Não foi possível guardar o marco.");
      return;
    }
    setCategoriaMarco("");
    setTituloMarco("");
    assinalarFeito("desenvolvimento");
    setAberto(null);
    router.refresh();
  }

  async function guardarObservacao() {
    const ok = await guardarRelatorio({});
    if (ok) {
      assinalarFeito("observacao");
      setAberto(null);
    }
  }

  async function enviarFoto() {
    const ficheiro = inputFotoRef.current?.files?.[0];
    if (!ficheiro || !turmaId) return;
    setAGuardar(true);
    setErro(null);
    const supabase = createClient();
    const caminho = `${escolaId}/${turmaId}/${Date.now()}-${caminhoSeguro(ficheiro.name)}`;
    const { error: errUpload } = await supabase.storage
      .from("fotos-turmas")
      .upload(caminho, ficheiro, { contentType: ficheiro.type });
    if (errUpload) {
      setAGuardar(false);
      setErro("Não foi possível enviar a foto.");
      return;
    }
    const { error: errInsert } = await supabase.from("fotos").insert({
      escola_id: escolaId,
      turma_id: turmaId,
      caminho,
      autor_id: perfilId,
    });
    setAGuardar(false);
    if (errInsert) {
      await supabase.storage.from("fotos-turmas").remove([caminho]);
      setErro("Não foi possível guardar a foto.");
      return;
    }
    if (inputFotoRef.current) inputFotoRef.current.value = "";
    assinalarFeito("foto");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {ACOES.map((a) => (
          <motion.button
            key={a.chave}
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => setAberto(aberto === a.chave ? null : a.chave)}
            className={`relative flex flex-col items-center gap-1.5 rounded-2xl border p-4 text-sm font-medium transition-colors ${
              aberto === a.chave
                ? "border-brand-accent bg-brand-accent-soft text-brand-accent dark:bg-brand-accent-soft-dark"
                : "border-brand-border text-brand-ink hover:bg-brand-accent-soft dark:border-brand-border-dark dark:text-brand-ink-dark dark:hover:bg-brand-accent-soft-dark"
            }`}
          >
            <span className="text-2xl" aria-hidden="true">
              {a.icone}
            </span>
            {a.rotulo}
            {feito === a.chave && (
              <span className="absolute -right-1 -top-1 rounded-full bg-brand-positive px-1.5 py-0.5 text-[10px] font-semibold text-white">
                ✓
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {erro && <p className="text-sm text-red-600 dark:text-red-400">{erro}</p>}

      <AnimatePresence mode="wait">
        {aberto === "refeicao" && (
          <motion.div
            key="refeicao"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-brand-border p-4 dark:border-brand-border-dark"
          >
            {(
              [
                ["pequeno_almoco", "Pequeno-almoço", pequenoAlmoco],
                ["almoco", "Almoço", almoco],
                ["lanche", "Lanche", lanche],
              ] as const
            ).map(([campo, rotulo, valor]) => (
              <div key={campo} className="flex flex-col gap-1.5">
                <span className="text-xs text-brand-muted dark:text-brand-muted-dark">
                  {rotulo}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {OPCOES_REFEICAO.map((o) => (
                    <motion.button
                      key={o.valor}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      disabled={aGuardar}
                      onClick={() => tocarRefeicao(campo, o.valor)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        valor === o.valor
                          ? "border-brand-accent bg-brand-accent text-white"
                          : "border-brand-border text-brand-muted hover:bg-brand-accent-soft dark:border-brand-border-dark dark:text-brand-muted-dark dark:hover:bg-brand-accent-soft-dark"
                      }`}
                    >
                      {o.etiqueta}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {aberto === "sesta" && (
          <motion.div
            key="sesta"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-brand-border p-4 dark:border-brand-border-dark"
          >
            {sonoInicio && (
              <p className="text-sm text-brand-ink dark:text-brand-ink-dark">
                Início: {sonoInicio}
                {sonoFim ? ` · Fim: ${sonoFim}` : ""}
              </p>
            )}
            {!sonoInicio ? (
              <motion.button whileTap={{ scale: 0.96 }} disabled={aGuardar} onClick={iniciarSesta} className={BOTAO_PRIMARIO}>
                Iniciar sesta agora
              </motion.button>
            ) : !sonoFim ? (
              <motion.button whileTap={{ scale: 0.96 }} disabled={aGuardar} onClick={terminarSesta} className={BOTAO_PRIMARIO}>
                Terminar sesta agora
              </motion.button>
            ) : (
              <motion.button whileTap={{ scale: 0.96 }} disabled={aGuardar} onClick={iniciarSesta} className={BOTAO_SECUNDARIO}>
                Registar nova sesta
              </motion.button>
            )}
          </motion.div>
        )}

        {aberto === "higiene" && (
          <motion.div
            key="higiene"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-brand-border p-4 dark:border-brand-border-dark"
          >
            <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
              Fraldas trocadas hoje: <span className="font-semibold text-brand-ink dark:text-brand-ink-dark">{fraldas}</span>
            </p>
            <motion.button whileTap={{ scale: 0.96 }} disabled={aGuardar} onClick={maisUmaFralda} className={BOTAO_PRIMARIO}>
              + 1 fralda trocada
            </motion.button>
          </motion.div>
        )}

        {aberto === "foto" && (
          <motion.div
            key="foto"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-brand-border p-4 dark:border-brand-border-dark"
          >
            {!turmaId ? (
              <p className="text-sm text-brand-muted dark:text-brand-muted-dark">
                Esta criança ainda não tem turma atribuída.
              </p>
            ) : (
              <>
                <input ref={inputFotoRef} type="file" accept="image/*" className={CAMPO} />
                <motion.button whileTap={{ scale: 0.96 }} disabled={aGuardar} onClick={enviarFoto} className={BOTAO_PRIMARIO}>
                  {aGuardar ? "A enviar…" : "Enviar foto"}
                </motion.button>
              </>
            )}
          </motion.div>
        )}

        {aberto === "observacao" && (
          <motion.div
            key="observacao"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-brand-border p-4 dark:border-brand-border-dark"
          >
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              placeholder="Ex.: participou numa atividade de pintura, dormiu bem…"
              className={`${CAMPO} w-full`}
            />
            <motion.button whileTap={{ scale: 0.96 }} disabled={aGuardar} onClick={guardarObservacao} className={BOTAO_PRIMARIO}>
              {aGuardar ? "A guardar…" : "Guardar observação"}
            </motion.button>
          </motion.div>
        )}

        {aberto === "desenvolvimento" && (
          <motion.div
            key="desenvolvimento"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-brand-border p-4 dark:border-brand-border-dark"
          >
            <div className="flex flex-wrap gap-1.5">
              {OPCOES_CATEGORIA.map((o) => (
                <motion.button
                  key={o.valor}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCategoriaMarco(o.valor)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    categoriaMarco === o.valor
                      ? "border-brand-accent bg-brand-accent text-white"
                      : "border-brand-border text-brand-muted hover:bg-brand-accent-soft dark:border-brand-border-dark dark:text-brand-muted-dark dark:hover:bg-brand-accent-soft-dark"
                  }`}
                >
                  {o.etiqueta}
                </motion.button>
              ))}
            </div>
            <input
              value={tituloMarco}
              onChange={(e) => setTituloMarco(e.target.value)}
              placeholder="Ex.: já consegue subir escadas sozinha"
              className={`${CAMPO} w-full`}
            />
            <motion.button whileTap={{ scale: 0.96 }} disabled={aGuardar} onClick={guardarMarco} className={BOTAO_PRIMARIO}>
              {aGuardar ? "A guardar…" : "Guardar marco"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
