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

/** Nomes fixos das escolas que este script cria — usados para encontrar
 * e apagar só o que é seu, mesmo que os perfis já tenham sido apagados
 * por outra via. Nunca apagar escolas por ordem geral: este script
 * partilha o projeto Supabase com `seed-demo.mjs`, que cria a sua
 * própria escola e não pode ser apagado por engano daqui. */
const NOMES_ESCOLAS = ["Creche Arco-Íris (fictícia)", "Creche Estrelinha (fictícia)"];

async function limpar() {
  console.log("A limpar dados fictícios anteriores…");

  const emails = new Set(Object.values(CONTAS).map((c) => c.email));
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  const idsAntigos = (data?.users ?? [])
    .filter((u) => emails.has(u.email))
    .map((u) => u.id);

  const escolaIds = new Set();
  if (idsAntigos.length > 0) {
    const { data: perfisAntigos } = await db
      .from("perfis")
      .select("escola_id")
      .in("id", idsAntigos);
    for (const p of perfisAntigos ?? []) escolaIds.add(p.escola_id);
  }
  const { data: escolasPorNome } = await db
    .from("escolas")
    .select("id")
    .in("nome", NOMES_ESCOLAS);
  for (const e of escolasPorNome ?? []) escolaIds.add(e.id);

  for (const escolaId of escolaIds) {
    await db.from("fotos").delete().eq("escola_id", escolaId);
    await db.from("relatorios_diarios").delete().eq("escola_id", escolaId);
    await db.from("presencas").delete().eq("escola_id", escolaId);
    await db.from("mensagens").delete().eq("escola_id", escolaId);
    await db.from("avisos").delete().eq("escola_id", escolaId);

    const { data: turmas } = await db.from("turmas").select("id").eq("escola_id", escolaId);
    const turmaIds = (turmas ?? []).map((t) => t.id);
    if (turmaIds.length > 0) {
      await db.from("staff_turmas").delete().in("turma_id", turmaIds);
    }

    const { data: criancas } = await db.from("criancas").select("id").eq("escola_id", escolaId);
    const criancaIds = (criancas ?? []).map((c) => c.id);
    if (criancaIds.length > 0) {
      await db.from("encarregados_criancas").delete().in("crianca_id", criancaIds);
    }

    await db.from("criancas").delete().eq("escola_id", escolaId);
    await db.from("perfis").delete().eq("escola_id", escolaId);
    await db.from("turmas").delete().eq("escola_id", escolaId);
    await db.from("escolas").delete().eq("id", escolaId);
  }

  for (const id of idsAntigos) await db.auth.admin.deleteUser(id);
}

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

  console.log("A criar avisos (mural) e mensagens…");
  const [avisoEscola] = await inserir("avisos", [
    {
      escola_id: arcoIris.id,
      turma_id: null,
      autor_id: ids.adminArcoIris,
      titulo: "Reunião geral de pais",
      corpo: "No dia 20, às 18h, reunião geral no salão principal.",
    },
  ]);
  const [avisoTurma] = await inserir("avisos", [
    {
      escola_id: arcoIris.id,
      turma_id: borboletas.id,
      autor_id: ids.staffBorboletas,
      titulo: "Fotografia escolar da turma",
      corpo: "Na quinta-feira as crianças trazem bata clara.",
    },
  ]);

  const [mensagemEnc] = await inserir("mensagens", [
    {
      escola_id: arcoIris.id,
      remetente_id: ids.encMatilde,
      destinatario_id: ids.staffBorboletas,
      corpo: "Bom dia, a Matilde hoje dorme mais tarde a sesta.",
    },
  ]);
  const [mensagemStaff] = await inserir("mensagens", [
    {
      escola_id: arcoIris.id,
      remetente_id: ids.staffBorboletas,
      destinatario_id: ids.encMatilde,
      corpo: "Boa tarde, ficou registado, obrigada por avisar!",
    },
  ]);

  console.log("A criar presenças (dia fixo, 2026-08-10)…");
  await inserir("presencas", [
    {
      escola_id: arcoIris.id,
      crianca_id: matilde.id,
      data: "2026-08-10",
      hora_entrada: "2026-08-10 08:15:00+01",
      registado_entrada_por: ids.staffBorboletas,
      hora_saida: "2026-08-10 17:30:00+01",
      levantado_por_id: ids.encMatilde,
      levantado_por_nome: "Carla Ferreira",
      registado_saida_por: ids.staffBorboletas,
    },
    {
      escola_id: arcoIris.id,
      crianca_id: tomas.id,
      data: "2026-08-10",
      hora_entrada: "2026-08-10 08:20:00+01",
      registado_entrada_por: ids.staffBorboletas,
    },
    {
      escola_id: arcoIris.id,
      crianca_id: leonor.id,
      data: "2026-08-10",
      hora_entrada: "2026-08-10 08:00:00+01",
      registado_entrada_por: ids.staffGirassois,
      hora_saida: "2026-08-10 17:00:00+01",
      levantado_por_id: ids.encLeonor,
      levantado_por_nome: "Diogo Pinto",
      registado_saida_por: ids.staffGirassois,
    },
  ]);

  console.log("A criar relatórios diários (dia fixo, 2026-08-10)…");
  await inserir("relatorios_diarios", [
    {
      escola_id: arcoIris.id,
      crianca_id: matilde.id,
      data: "2026-08-10",
      pequeno_almoco: "comeu_tudo",
      almoco: "comeu_metade",
      lanche: "comeu_tudo",
      sono_inicio: "13:00",
      sono_fim: "14:30",
      fraldas_trocadas: 2,
      notas: "Dia tranquilo, brincou muito no recreio.",
      registado_por: ids.staffBorboletas,
    },
    {
      escola_id: arcoIris.id,
      crianca_id: tomas.id,
      data: "2026-08-10",
      pequeno_almoco: "comeu_pouco",
      fraldas_trocadas: 1,
      registado_por: ids.staffBorboletas,
    },
    {
      escola_id: arcoIris.id,
      crianca_id: leonor.id,
      data: "2026-08-10",
      pequeno_almoco: "comeu_tudo",
      almoco: "comeu_tudo",
      lanche: "comeu_metade",
      sono_inicio: "12:45",
      sono_fim: "14:15",
      fraldas_trocadas: 3,
      notas: "Precisou de mais colo para adormecer hoje.",
      registado_por: ids.staffGirassois,
    },
  ]);

  console.log("A criar uma foto de exemplo (turma Borboletas)…");
  // PNG 1x1 transparente — só para haver um ficheiro real a testar as
  // políticas de Storage, não uma fotografia a sério.
  const pngExemplo = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  const caminhoFoto = `${arcoIris.id}/${borboletas.id}/exemplo.png`;
  const { error: errUpload } = await db.storage
    .from("fotos-turmas")
    .upload(caminhoFoto, pngExemplo, { contentType: "image/png", upsert: true });
  if (errUpload) throw new Error(`Upload de foto de exemplo: ${errUpload.message}`);
  await inserir("fotos", [
    {
      escola_id: arcoIris.id,
      turma_id: borboletas.id,
      caminho: caminhoFoto,
      legenda: "Foto de exemplo (fictícia).",
      autor_id: ids.staffBorboletas,
    },
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
    avisos: {
      escola: avisoEscola.id,
      turma: avisoTurma.id,
    },
    mensagens: {
      encPergunta: mensagemEnc.id,
      staffResposta: mensagemStaff.id,
    },
  };
  const { writeFileSync } = await import("node:fs");
  writeFileSync(
    new URL("./seed-ids.json", import.meta.url),
    JSON.stringify(referencia, null, 2),
  );
}

// Só corre a seed automaticamente quando o ficheiro é executado
// diretamente (`npm run seed`) — nunca quando é importado só para
// reaproveitar `CONTAS`/`PALAVRA_PASSE`, como faz `test-rls.mjs`. Sem
// esta condição, correr os testes voltava a apagar e recriar todos os
// dados a meio da leitura, dando falsos negativos.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error("\n✗ Falhou:", e.message);
    process.exit(1);
  });
}
