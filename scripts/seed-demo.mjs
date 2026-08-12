/**
 * Cria uma escola FICTÍCIA rica em conteúdo, pensada para demonstrar o
 * produto (a alguém da escola-piloto, investidores, etc.) — não para os
 * testes automáticos de RLS (esses usam `seed.mjs`).
 *
 * Só mexe em contas com o email reservado a este script (@example.com,
 * prefixo "demo."), por isso pode correr sem apagar os dados de teste
 * de `seed.mjs`, e vice-versa.
 *
 * ATENÇÃO: usa a chave `service_role`, que ignora todo o RLS. Nunca
 * correr contra uma base de dados com dados reais de crianças.
 *
 * Correr com:  npm run seed:demo
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

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

export const PALAVRA_PASSE_DEMO = "Demo1234!";

export const CONTAS_DEMO = {
  admin: { email: "demo.mariana@example.com", nome: "Mariana Costa" },
  staffPassarinhos: { email: "demo.ines@example.com", nome: "Inês Rocha" },
  staffEstrelinhas: { email: "demo.tiago@example.com", nome: "Tiago Fernandes" },
  encBeatriz: { email: "demo.sofia@example.com", nome: "Sofia Lopes" },
  encGoncalo: { email: "demo.pedro@example.com", nome: "Pedro Silva" },
  encFrancisca: { email: "demo.catarina@example.com", nome: "Catarina Alves" },
  encRodrigo: { email: "demo.miguel@example.com", nome: "Miguel Matos" },
};

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

async function limpar() {
  console.log("A limpar dados de demonstração anteriores…");

  const emails = new Set(Object.values(CONTAS_DEMO).map((c) => c.email));
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  const idsAntigos = (data?.users ?? [])
    .filter((u) => emails.has(u.email))
    .map((u) => u.id);

  if (idsAntigos.length > 0) {
    const { data: perfisAntigos } = await db
      .from("perfis")
      .select("escola_id")
      .in("id", idsAntigos);
    const escolaId = perfisAntigos?.[0]?.escola_id;
    if (escolaId) {
      await db.from("fotos").delete().eq("escola_id", escolaId);
      await db.from("relatorios_diarios").delete().eq("escola_id", escolaId);
      await db.from("presencas").delete().eq("escola_id", escolaId);
      await db.from("mensagens").delete().eq("escola_id", escolaId);
      await db.from("avisos").delete().eq("escola_id", escolaId);
      await db
        .from("staff_turmas")
        .delete()
        .in("turma_id", (
          await db.from("turmas").select("id").eq("escola_id", escolaId)
        ).data?.map((t) => t.id) ?? [ZERO_UUID]);
      await db
        .from("encarregados_criancas")
        .delete()
        .in("crianca_id", (
          await db.from("criancas").select("id").eq("escola_id", escolaId)
        ).data?.map((c) => c.id) ?? [ZERO_UUID]);
      await db.from("criancas").delete().eq("escola_id", escolaId);
      await db.from("perfis").delete().eq("escola_id", escolaId);
      await db.from("turmas").delete().eq("escola_id", escolaId);
      await db.from("escolas").delete().eq("id", escolaId);
    }
    for (const id of idsAntigos) await db.auth.admin.deleteUser(id);
  }
}

async function criarUtilizador(conta) {
  const { data, error } = await db.auth.admin.createUser({
    email: conta.email,
    password: PALAVRA_PASSE_DEMO,
    email_confirm: true,
  });
  if (error) throw new Error(`Criar ${conta.email}: ${error.message}`);
  return data.user.id;
}

async function inserir(tabela, linhas) {
  const { data, error } = await db.from(tabela).insert(linhas).select();
  if (error) throw new Error(`Inserir em ${tabela}: ${error.message}`);
  return data;
}

function horaDeHoje(hora) {
  const hoje = new Date().toISOString().slice(0, 10);
  return `${hoje} ${hora}+01`;
}

async function main() {
  await limpar();

  console.log("A criar a escola de demonstração…");
  const [escola] = await inserir("escolas", [
    { nome: "Cantinho Feliz (demonstração)" },
  ]);

  console.log("A criar turmas…");
  const [passarinhos, estrelinhas] = await inserir("turmas", [
    { escola_id: escola.id, nome: "Passarinhos" },
    { escola_id: escola.id, nome: "Estrelinhas" },
  ]);

  console.log("A criar contas e perfis…");
  const ids = {};
  for (const [chave, conta] of Object.entries(CONTAS_DEMO)) {
    ids[chave] = await criarUtilizador(conta);
  }

  await inserir("perfis", [
    { id: ids.admin, escola_id: escola.id, papel: "admin", nome: CONTAS_DEMO.admin.nome },
    { id: ids.staffPassarinhos, escola_id: escola.id, papel: "staff", nome: CONTAS_DEMO.staffPassarinhos.nome },
    { id: ids.staffEstrelinhas, escola_id: escola.id, papel: "staff", nome: CONTAS_DEMO.staffEstrelinhas.nome },
    { id: ids.encBeatriz, escola_id: escola.id, papel: "encarregado", nome: CONTAS_DEMO.encBeatriz.nome },
    { id: ids.encGoncalo, escola_id: escola.id, papel: "encarregado", nome: CONTAS_DEMO.encGoncalo.nome },
    { id: ids.encFrancisca, escola_id: escola.id, papel: "encarregado", nome: CONTAS_DEMO.encFrancisca.nome },
    { id: ids.encRodrigo, escola_id: escola.id, papel: "encarregado", nome: CONTAS_DEMO.encRodrigo.nome },
  ]);

  console.log("A criar crianças…");
  const [beatriz, goncalo] = await inserir("criancas", [
    { escola_id: escola.id, turma_id: passarinhos.id, nome: "Beatriz Lopes", data_nascimento: "2022-03-14" },
    { escola_id: escola.id, turma_id: passarinhos.id, nome: "Gonçalo Silva", data_nascimento: "2022-06-02" },
  ]);
  const [francisca, rodrigo] = await inserir("criancas", [
    { escola_id: escola.id, turma_id: estrelinhas.id, nome: "Francisca Alves", data_nascimento: "2021-09-21" },
    { escola_id: escola.id, turma_id: estrelinhas.id, nome: "Rodrigo Matos", data_nascimento: "2021-12-08" },
  ]);

  console.log("A ligar encarregados e staff…");
  await inserir("encarregados_criancas", [
    { encarregado_id: ids.encBeatriz, crianca_id: beatriz.id, parentesco: "Mãe" },
    { encarregado_id: ids.encGoncalo, crianca_id: goncalo.id, parentesco: "Pai" },
    { encarregado_id: ids.encFrancisca, crianca_id: francisca.id, parentesco: "Mãe" },
    { encarregado_id: ids.encRodrigo, crianca_id: rodrigo.id, parentesco: "Pai" },
  ]);

  await inserir("staff_turmas", [
    { staff_id: ids.staffPassarinhos, turma_id: passarinhos.id },
    { staff_id: ids.staffEstrelinhas, turma_id: estrelinhas.id },
  ]);

  console.log("A criar avisos (mural) e mensagens…");
  await inserir("avisos", [
    {
      escola_id: escola.id,
      turma_id: null,
      autor_id: ids.admin,
      titulo: "Bem-vindos ao novo ano letivo!",
      corpo: "Estamos muito felizes por receber as vossas crianças. Qualquer dúvida, contactem-nos através da aplicação.",
    },
    {
      escola_id: escola.id,
      turma_id: passarinhos.id,
      autor_id: ids.staffPassarinhos,
      titulo: "Precisamos de fraldas extra",
      corpo: "Pedimos que tragam uma embalagem de fraldas de reserva para o cacifo da turma até sexta-feira.",
    },
    {
      escola_id: escola.id,
      turma_id: estrelinhas.id,
      autor_id: ids.staffEstrelinhas,
      titulo: "Visita de estudo ao jardim botânico",
      corpo: "No dia 25 vamos ao jardim botânico. Por favor tragam boné e garrafa de água identificada.",
    },
  ]);

  await inserir("mensagens", [
    {
      escola_id: escola.id,
      remetente_id: ids.encBeatriz,
      destinatario_id: ids.staffPassarinhos,
      corpo: "Bom dia! A Beatriz dormiu mal esta noite, pode estar mais sonolenta hoje.",
    },
  ]);
  await inserir("mensagens", [
    {
      escola_id: escola.id,
      remetente_id: ids.staffPassarinhos,
      destinatario_id: ids.encBeatriz,
      corpo: "Obrigada por avisar! Vamos ter atenção e deixamo-la descansar um pouco mais na sesta.",
    },
  ]);

  console.log("A criar presenças de hoje…");
  await inserir("presencas", [
    {
      escola_id: escola.id,
      crianca_id: beatriz.id,
      data: new Date().toISOString().slice(0, 10),
      hora_entrada: horaDeHoje("08:10:00"),
      registado_entrada_por: ids.staffPassarinhos,
    },
    {
      escola_id: escola.id,
      crianca_id: goncalo.id,
      data: new Date().toISOString().slice(0, 10),
      hora_entrada: horaDeHoje("08:25:00"),
      registado_entrada_por: ids.staffPassarinhos,
      hora_saida: horaDeHoje("13:00:00"),
      levantado_por_id: ids.encGoncalo,
      levantado_por_nome: "Pedro Silva",
      registado_saida_por: ids.staffPassarinhos,
    },
    {
      escola_id: escola.id,
      crianca_id: francisca.id,
      data: new Date().toISOString().slice(0, 10),
      hora_entrada: horaDeHoje("08:05:00"),
      registado_entrada_por: ids.staffEstrelinhas,
    },
    {
      escola_id: escola.id,
      crianca_id: rodrigo.id,
      data: new Date().toISOString().slice(0, 10),
      hora_entrada: horaDeHoje("08:40:00"),
      registado_entrada_por: ids.staffEstrelinhas,
    },
  ]);

  console.log("A criar relatórios diários…");
  await inserir("relatorios_diarios", [
    {
      escola_id: escola.id,
      crianca_id: beatriz.id,
      data: new Date().toISOString().slice(0, 10),
      pequeno_almoco: "comeu_tudo",
      almoco: "comeu_metade",
      lanche: "comeu_tudo",
      sono_inicio: "13:00",
      sono_fim: "14:00",
      fraldas_trocadas: 3,
      notas: "Dia tranquilo, brincou bastante com os blocos de construção.",
      registado_por: ids.staffPassarinhos,
    },
    {
      escola_id: escola.id,
      crianca_id: francisca.id,
      data: new Date().toISOString().slice(0, 10),
      pequeno_almoco: "comeu_tudo",
      almoco: "comeu_tudo",
      lanche: "comeu_metade",
      sono_inicio: "13:15",
      sono_fim: "14:30",
      fraldas_trocadas: 0,
      notas: "Participou com muito entusiasmo na atividade de pintura.",
      registado_por: ids.staffEstrelinhas,
    },
  ]);

  console.log("A criar fotos de exemplo…");
  // Imagens ilustrativas simples (não fotografias a sério, mas visíveis
  // — ao contrário de um pixel transparente, que aparece como imagem
  // partida na aplicação e fica mal numa demonstração).
  for (const [turma, autorId, legenda, ficheiro] of [
    [passarinhos, ids.staffPassarinhos, "Manhã de brincadeiras na turma Passarinhos.", "demo-passarinhos.png"],
    [estrelinhas, ids.staffEstrelinhas, "Atividade de pintura na turma Estrelinhas.", "demo-estrelinhas.png"],
  ]) {
    const imagem = readFileSync(new URL(`./assets/${ficheiro}`, import.meta.url));
    const caminho = `${escola.id}/${turma.id}/exemplo-${Date.now()}.png`;
    const { error: errUpload } = await db.storage
      .from("fotos-turmas")
      .upload(caminho, imagem, { contentType: "image/png", upsert: true });
    if (errUpload) throw new Error(`Upload de foto: ${errUpload.message}`);
    await inserir("fotos", [
      { escola_id: escola.id, turma_id: turma.id, caminho, legenda, autor_id: autorId },
    ]);
  }

  console.log("\n✓ Escola de demonstração criada.\n");
  console.log(`Palavra-passe de todas as contas: ${PALAVRA_PASSE_DEMO}\n`);
  console.table(
    Object.entries(CONTAS_DEMO).map(([chave, c]) => ({
      conta: chave,
      email: c.email,
      nome: c.nome,
    })),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error("\n✗ Falhou:", e.message);
    process.exit(1);
  });
}
