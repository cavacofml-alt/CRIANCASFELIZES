/**
 * Popula a base de dados com DADOS FICTÍCIOS para desenvolvimento.
 *
 * ATENÇÃO: usa a chave `service_role`, que ignora todo o RLS. Nunca
 * correr contra uma base de dados com dados reais de crianças.
 *
 * Correr com:  npm run seed
 *
 * Cria propositadamente DUAS escolas. A segunda existe para provarmos
 * que uma escola nunca consegue ver os dados da outra.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const PALAVRA_PASSE = "Teste1234!";

/** Contas fictícias. Domínio example.com é reservado — nunca envia email real. */
export const CONTAS = {
  adminArcoIris: { email: "rita.admin@example.com", nome: "Rita Almeida" },
  staffBorboletas: { email: "ana.silva@example.com", nome: "Ana Silva" },
  staffGirassois: { email: "bruno.costa@example.com", nome: "Bruno Costa" },
  encMatilde: { email: "carla.ferreira@example.com", nome: "Carla Ferreira" },
  encLeonor: { email: "diogo.pinto@example.com", nome: "Diogo Pinto" },
  adminEstrelinha: { email: "paulo.admin@example.com", nome: "Paulo Moreira" },
};

async function limpar() {
  console.log("A limpar dados fictícios anteriores…");

  // A ordem respeita as chaves estrangeiras.
  await db.from("staff_turmas").delete().neq("staff_id", ZERO_UUID);
  await db.from("encarregados_criancas").delete().neq("crianca_id", ZERO_UUID);
  await db.from("criancas").delete().neq("id", ZERO_UUID);
  await db.from("perfis").delete().neq("id", ZERO_UUID);
  await db.from("turmas").delete().neq("id", ZERO_UUID);
  await db.from("escolas").delete().neq("id", ZERO_UUID);

  const emails = new Set(Object.values(CONTAS).map((c) => c.email));
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  for (const u of data?.users ?? []) {
    if (emails.has(u.email)) await db.auth.admin.deleteUser(u.id);
  }
}

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

async function criarUtilizador(conta) {
  const { data, error } = await db.auth.admin.createUser({
    email: conta.email,
    password: PALAVRA_PASSE,
    email_confirm: true, // evita envio de email de confirmação
  });
  if (error) throw new Error(`Criar ${conta.email}: ${error.message}`);
  return data.user.id;
}

async function inserir(tabela, linhas) {
  const { data, error } = await db.from(tabela).insert(linhas).select();
  if (error) throw new Error(`Inserir em ${tabela}: ${error.message}`);
  return data;
}

async function main() {
  await limpar();

  console.log("A criar escolas…");
  const [arcoIris, estrelinha] = await inserir("escolas", [
    { nome: "Creche Arco-Íris (fictícia)" },
    { nome: "Creche Estrelinha (fictícia)" },
  ]);

  console.log("A criar turmas…");
  const [borboletas, girassois] = await inserir("turmas", [
    { escola_id: arcoIris.id, nome: "Borboletas" },
    { escola_id: arcoIris.id, nome: "Girassóis" },
  ]);
  const [luas] = await inserir("turmas", [
    { escola_id: estrelinha.id, nome: "Luas" },
  ]);

  console.log("A criar contas e perfis…");
  const ids = {};
  for (const [chave, conta] of Object.entries(CONTAS)) {
    ids[chave] = await criarUtilizador(conta);
  }

  await inserir("perfis", [
    {
      id: ids.adminArcoIris,
      escola_id: arcoIris.id,
      papel: "admin",
      nome: CONTAS.adminArcoIris.nome,
    },
    {
      id: ids.staffBorboletas,
      escola_id: arcoIris.id,
      papel: "staff",
      nome: CONTAS.staffBorboletas.nome,
    },
    {
      id: ids.staffGirassois,
      escola_id: arcoIris.id,
      papel: "staff",
      nome: CONTAS.staffGirassois.nome,
    },
    {
      id: ids.encMatilde,
      escola_id: arcoIris.id,
      papel: "encarregado",
      nome: CONTAS.encMatilde.nome,
    },
    {
      id: ids.encLeonor,
      escola_id: arcoIris.id,
      papel: "encarregado",
      nome: CONTAS.encLeonor.nome,
    },
    {
      id: ids.adminEstrelinha,
      escola_id: estrelinha.id,
      papel: "admin",
      nome: CONTAS.adminEstrelinha.nome,
    },
  ]);

  console.log("A criar crianças…");
  const [matilde, tomas] = await inserir("criancas", [
    {
      escola_id: arcoIris.id,
      turma_id: borboletas.id,
      nome: "Matilde Ferreira",
      data_nascimento: "2022-04-12",
    },
    {
      escola_id: arcoIris.id,
      turma_id: borboletas.id,
      nome: "Tomás Nunes",
      data_nascimento: "2022-09-30",
    },
  ]);
  const [leonor] = await inserir("criancas", [
    {
      escola_id: arcoIris.id,
      turma_id: girassois.id,
      nome: "Leonor Pinto",
      data_nascimento: "2021-11-05",
    },
  ]);
  const [iris] = await inserir("criancas", [
    {
      escola_id: estrelinha.id,
      turma_id: luas.id,
      nome: "Íris Almeida",
      data_nascimento: "2022-02-20",
    },
  ]);

  console.log("A ligar encarregados e staff…");
  await inserir("encarregados_criancas", [
    {
      encarregado_id: ids.encMatilde,
      crianca_id: matilde.id,
      parentesco: "Mãe",
    },
    { encarregado_id: ids.encLeonor, crianca_id: leonor.id, parentesco: "Pai" },
  ]);

  await inserir("staff_turmas", [
    { staff_id: ids.staffBorboletas, turma_id: borboletas.id },
    { staff_id: ids.staffGirassois, turma_id: girassois.id },
  ]);

  console.log("\n✓ Dados fictícios criados.\n");
  console.log(`Palavra-passe de todas as contas: ${PALAVRA_PASSE}\n`);
  console.table(
    Object.entries(CONTAS).map(([chave, c]) => ({
      conta: chave,
      email: c.email,
      nome: c.nome,
    })),
  );

  // Guardado para o script de testes não ter de adivinhar ids.
  const referencia = {
    escolas: { arcoIris: arcoIris.id, estrelinha: estrelinha.id },
    turmas: {
      borboletas: borboletas.id,
      girassois: girassois.id,
      luas: luas.id,
    },
    criancas: {
      matilde: matilde.id,
      tomas: tomas.id,
      leonor: leonor.id,
      iris: iris.id,
    },
    perfis: ids,
  };
  const { writeFileSync } = await import("node:fs");
  writeFileSync(
    new URL("./seed-ids.json", import.meta.url),
    JSON.stringify(referencia, null, 2),
  );
}

main().catch((e) => {
  console.error("\n✗ Falhou:", e.message);
  process.exit(1);
});
