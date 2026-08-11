/**
 * TESTE ADVERSARIAL DE RLS
 *
 * Não testa se a aplicação funciona — testa se a base de dados RECUSA
 * o que tem de recusar. Cada teste tenta aceder a dados a que aquele
 * utilizador não deveria ter acesso.
 *
 * Usa a chave `anon` e faz login a sério, exatamente como o navegador de
 * um utilizador. Se a proteção fosse feita só na aplicação (e não na
 * base de dados), estes testes falhavam.
 *
 * Correr com:  npm run test:rls   (depois de npm run seed)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { CONTAS, PALAVRA_PASSE } from "./seed.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const ids = JSON.parse(
  readFileSync(new URL("./seed-ids.json", import.meta.url), "utf8"),
);

let passou = 0;
let falhou = 0;

function verificar(descricao, condicao, detalhe = "") {
  if (condicao) {
    passou++;
    console.log(`  ✓ ${descricao}`);
  } else {
    falhou++;
    console.log(`  ✗ ${descricao}${detalhe ? ` — ${detalhe}` : ""}`);
  }
}

async function sessao(conta) {
  const c = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await c.auth.signInWithPassword({
    email: conta.email,
    password: PALAVRA_PASSE,
  });
  if (error) throw new Error(`Login ${conta.email}: ${error.message}`);
  return c;
}

async function main() {
  console.log("\n=== TESTE ADVERSARIAL DE RLS ===\n");

  // -------------------------------------------------------------------
  console.log("VISITANTE NÃO AUTENTICADO (sem login)");
  const anon = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  {
    const { data: cr } = await anon.from("criancas").select("id");
    verificar("não vê nenhuma criança", (cr?.length ?? 0) === 0);
    const { data: pf } = await anon.from("perfis").select("id");
    verificar("não vê nenhum perfil", (pf?.length ?? 0) === 0);
    const { data: es } = await anon.from("escolas").select("id");
    verificar("não vê nenhuma escola", (es?.length ?? 0) === 0);
  }

  // -------------------------------------------------------------------
  console.log("\nENCARREGADA Carla Ferreira (mãe da Matilde, Arco-Íris)");
  {
    const c = await sessao(CONTAS.encMatilde);

    const { data: cr } = await c.from("criancas").select("id, nome");
    verificar(
      "vê exatamente 1 criança (a sua educanda)",
      cr?.length === 1 && cr[0].nome === "Matilde Ferreira",
      `viu ${cr?.length ?? 0}: ${cr?.map((x) => x.nome).join(", ")}`,
    );

    const { data: tomas } = await c
      .from("criancas")
      .select("id")
      .eq("id", ids.criancas.tomas);
    verificar(
      "NÃO vê o Tomás (mesma turma, outro encarregado)",
      (tomas?.length ?? 0) === 0,
    );

    const { data: leonor } = await c
      .from("criancas")
      .select("id")
      .eq("id", ids.criancas.leonor);
    verificar("NÃO vê a Leonor (outra turma)", (leonor?.length ?? 0) === 0);

    const { data: iris } = await c
      .from("criancas")
      .select("id")
      .eq("id", ids.criancas.iris);
    verificar("NÃO vê a Íris (outra escola)", (iris?.length ?? 0) === 0);

    const { data: pf } = await c.from("perfis").select("id");
    verificar("vê apenas o seu próprio perfil", pf?.length === 1);

    const { data: tu } = await c.from("turmas").select("nome");
    verificar(
      "vê apenas a turma da sua educanda",
      tu?.length === 1 && tu[0].nome === "Borboletas",
    );

    const { data: lig } = await c
      .from("encarregados_criancas")
      .select("crianca_id");
    verificar("vê apenas a sua própria ligação", lig?.length === 1);

    const { error: errIns } = await c.from("criancas").insert({
      escola_id: ids.escolas.arcoIris,
      turma_id: ids.turmas.borboletas,
      nome: "Criança Intrusa",
    });
    verificar("NÃO consegue inscrever uma criança", errIns !== null);

    // Tentativa de escalada de privilégios.
    await c
      .from("perfis")
      .update({ papel: "admin" })
      .eq("id", ids.perfis.encMatilde);
    const { data: depois } = await c
      .from("perfis")
      .select("papel")
      .eq("id", ids.perfis.encMatilde)
      .single();
    verificar(
      "NÃO consegue promover-se a administradora",
      depois?.papel === "encarregado",
      `papel ficou: ${depois?.papel}`,
    );
  }

  // -------------------------------------------------------------------
  console.log("\nEDUCADORA Ana Silva (turma Borboletas)");
  {
    const c = await sessao(CONTAS.staffBorboletas);

    const { data: cr } = await c.from("criancas").select("nome");
    verificar(
      "vê as 2 crianças da sua turma",
      cr?.length === 2,
      `viu ${cr?.length ?? 0}`,
    );

    const { data: leonor } = await c
      .from("criancas")
      .select("id")
      .eq("id", ids.criancas.leonor);
    verificar(
      "NÃO vê a Leonor (turma do colega Bruno)",
      (leonor?.length ?? 0) === 0,
    );

    const { data: iris } = await c
      .from("criancas")
      .select("id")
      .eq("id", ids.criancas.iris);
    verificar("NÃO vê crianças de outra escola", (iris?.length ?? 0) === 0);

    const { data: enc } = await c
      .from("perfis")
      .select("nome")
      .eq("papel", "encarregado");
    verificar(
      "vê apenas os encarregados da sua turma (1)",
      enc?.length === 1 && enc[0].nome === "Carla Ferreira",
      `viu ${enc?.length ?? 0}: ${enc?.map((x) => x.nome).join(", ")}`,
    );

    const { error: errIns } = await c.from("criancas").insert({
      escola_id: ids.escolas.arcoIris,
      turma_id: ids.turmas.borboletas,
      nome: "Criança Intrusa",
    });
    verificar("NÃO consegue inscrever uma criança", errIns !== null);
  }

  // -------------------------------------------------------------------
  console.log("\nEDUCADOR Bruno Costa (turma Girassóis)");
  {
    const c = await sessao(CONTAS.staffGirassois);

    const { data: cr } = await c.from("criancas").select("nome");
    verificar(
      "vê apenas a criança da sua turma",
      cr?.length === 1 && cr[0].nome === "Leonor Pinto",
      `viu ${cr?.length ?? 0}`,
    );

    const { data: enc } = await c
      .from("perfis")
      .select("nome")
      .eq("papel", "encarregado");
    verificar(
      "NÃO vê a encarregada da turma do colega",
      enc?.length === 1 && enc[0].nome === "Diogo Pinto",
      `viu: ${enc?.map((x) => x.nome).join(", ")}`,
    );
  }

  // -------------------------------------------------------------------
  console.log("\nADMIN Rita Almeida (Creche Arco-Íris)");
  {
    const c = await sessao(CONTAS.adminArcoIris);

    const { data: cr } = await c.from("criancas").select("nome");
    verificar(
      "vê as 3 crianças da sua escola",
      cr?.length === 3,
      `viu ${cr?.length ?? 0}`,
    );

    const { data: iris } = await c
      .from("criancas")
      .select("id")
      .eq("id", ids.criancas.iris);
    verificar(
      "NÃO vê a criança da outra escola (isolamento)",
      (iris?.length ?? 0) === 0,
    );

    const { data: es } = await c.from("escolas").select("nome");
    verificar("vê apenas a sua escola", es?.length === 1);

    const { error: errOutra } = await c.from("criancas").insert({
      escola_id: ids.escolas.estrelinha,
      turma_id: ids.turmas.luas,
      nome: "Criança Injetada",
    });
    verificar(
      "NÃO consegue inscrever criança noutra escola",
      errOutra !== null,
    );

    const { data: nova, error: errPropria } = await c
      .from("criancas")
      .insert({
        escola_id: ids.escolas.arcoIris,
        turma_id: ids.turmas.borboletas,
        nome: "Criança Teste Temporária",
      })
      .select()
      .single();
    verificar("consegue inscrever criança na sua escola", errPropria === null);
    if (nova) await c.from("criancas").delete().eq("id", nova.id);
  }

  // -------------------------------------------------------------------
  console.log("\nADMIN Paulo Moreira (Creche Estrelinha — escola vizinha)");
  {
    const c = await sessao(CONTAS.adminEstrelinha);

    const { data: cr } = await c.from("criancas").select("nome");
    verificar(
      "vê apenas a criança da sua escola",
      cr?.length === 1 && cr[0].nome === "Íris Almeida",
      `viu ${cr?.length ?? 0}`,
    );

    const { data: pf } = await c.from("perfis").select("nome");
    verificar(
      "NÃO vê perfis da outra escola",
      pf?.length === 1,
      `viu ${pf?.length ?? 0}`,
    );
  }

  // -------------------------------------------------------------------
  console.log(`\n=== ${passou} passaram, ${falhou} falharam ===\n`);
  if (falhou > 0) {
    console.log("SEGURANÇA COMPROMETIDA — corrigir antes de avançar.\n");
    process.exit(1);
  }
  console.log("Todas as tentativas de acesso indevido foram bloqueadas.\n");
}

main().catch((e) => {
  console.error("\n✗ Erro:", e.message);
  process.exit(1);
});
