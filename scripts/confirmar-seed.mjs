import { createInterface } from "node:readline/promises";

/**
 * Impede correr um script destrutivo/de demonstração por engano contra
 * o projeto Supabase errado (ex.: um futuro projeto de produção com
 * dados reais de crianças). Mostra sempre a URL alvo antes de agir.
 *
 * Em terminal interativo, pede confirmação escrita. Em contexto não
 * interativo (scripts automáticos, CI), exige a variável de ambiente
 * `CONFIRMAR_SEED=sim` — nunca avança silenciosamente.
 */
export async function confirmarAmbiente(url) {
  console.log(`Alvo: ${url}`);

  if (process.env.CONFIRMAR_SEED === "sim") return;

  if (!process.stdin.isTTY) {
    console.error(
      "\nContexto não interativo: defina CONFIRMAR_SEED=sim para confirmar " +
        "que este é o projeto Supabase de desenvolvimento/demonstração correto.",
    );
    process.exit(1);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const resposta = await rl.question(
    'Isto vai escrever/apagar dados no projeto acima. Escreva "sim" para continuar: ',
  );
  rl.close();

  if (resposta.trim().toLowerCase() !== "sim") {
    console.error("Cancelado.");
    process.exit(1);
  }
}
