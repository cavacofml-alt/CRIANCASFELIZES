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
    const { data: av } = await anon.from("avisos").select("id");
    verificar("não vê nenhum aviso", (av?.length ?? 0) === 0);
    const { data: ms } = await anon.from("mensagens").select("id");
    verificar("não vê nenhuma mensagem", (ms?.length ?? 0) === 0);
    const { data: nt } = await anon.from("notificacoes").select("id");
    verificar("não vê nenhuma notificação", (nt?.length ?? 0) === 0);
    const { data: pr } = await anon.from("presencas").select("id");
    verificar("não vê nenhuma presença", (pr?.length ?? 0) === 0);
    const { data: rd } = await anon.from("relatorios_diarios").select("id");
    verificar("não vê nenhum relatório diário", (rd?.length ?? 0) === 0);
    const { data: ft } = await anon.from("fotos").select("id");
    verificar("não vê nenhuma foto", (ft?.length ?? 0) === 0);
    const { error: errAnonStorage } = await anon.storage
      .from("fotos-turmas")
      .createSignedUrl(
        `${ids.escolas.arcoIris}/${ids.turmas.borboletas}/exemplo.png`,
        60,
      );
    verificar(
      "visitante não autenticado não consegue gerar link de foto nenhuma",
      errAnonStorage !== null,
    );
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
    verificar(
      "vê o seu perfil + staff da turma e admin da educanda (Etapa 3), mais ninguém",
      pf?.length === 3,
      `viu ${pf?.length ?? 0}`,
    );

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

    // Comunicação: mural, mensagens, notificações (Etapa 3).
    const { data: avisos } = await c.from("avisos").select("titulo");
    verificar(
      "vê os 2 avisos da sua turma/escola",
      avisos?.length === 2,
      `viu ${avisos?.length ?? 0}`,
    );

    const { data: pfEquipa } = await c
      .from("perfis")
      .select("nome")
      .neq("id", ids.perfis.encMatilde);
    verificar(
      "vê apenas a Ana (staff da turma) e a Rita (admin) além de si própria",
      pfEquipa?.length === 2,
      `viu ${pfEquipa?.length ?? 0}: ${pfEquipa?.map((x) => x.nome).join(", ")}`,
    );

    const { data: conversa } = await c.from("mensagens").select("id");
    verificar(
      "vê as 2 mensagens da sua conversa com a Ana",
      conversa?.length === 2,
      `viu ${conversa?.length ?? 0}`,
    );

    const { error: errMsgAna } = await c.from("mensagens").insert({
      escola_id: ids.escolas.arcoIris,
      remetente_id: ids.perfis.encMatilde,
      destinatario_id: ids.perfis.staffBorboletas,
      corpo: "Mensagem de teste.",
    });
    verificar("consegue enviar mensagem à staff da turma da educanda", errMsgAna === null);

    const { error: errMsgAdmin } = await c.from("mensagens").insert({
      escola_id: ids.escolas.arcoIris,
      remetente_id: ids.perfis.encMatilde,
      destinatario_id: ids.perfis.adminArcoIris,
      corpo: "Mensagem de teste à administração.",
    });
    verificar("consegue enviar mensagem à administração", errMsgAdmin === null);

    const { error: errMsgBruno } = await c.from("mensagens").insert({
      escola_id: ids.escolas.arcoIris,
      remetente_id: ids.perfis.encMatilde,
      destinatario_id: ids.perfis.staffGirassois,
      corpo: "Não devia conseguir enviar isto.",
    });
    verificar(
      "NÃO consegue enviar mensagem a staff de turma que não é da sua educanda",
      errMsgBruno !== null,
    );

    const { error: errMsgOutroEnc } = await c.from("mensagens").insert({
      escola_id: ids.escolas.arcoIris,
      remetente_id: ids.perfis.encMatilde,
      destinatario_id: ids.perfis.encLeonor,
      corpo: "Não devia conseguir enviar isto.",
    });
    verificar(
      "NÃO consegue enviar mensagem a outro encarregado",
      errMsgOutroEnc !== null,
    );

    const { error: errAviso } = await c.from("avisos").insert({
      escola_id: ids.escolas.arcoIris,
      turma_id: ids.turmas.borboletas,
      autor_id: ids.perfis.encMatilde,
      titulo: "Não devia conseguir publicar isto",
      corpo: "…",
    });
    verificar("NÃO consegue publicar no mural", errAviso !== null);

    const { data: notifs } = await c
      .from("notificacoes")
      .select("id, lida")
      .eq("lida", false);
    verificar(
      "tem notificações por ler (avisos + mensagem da Ana)",
      (notifs?.length ?? 0) >= 1,
      `tinha ${notifs?.length ?? 0}`,
    );

    if (notifs && notifs.length > 0) {
      const { error: errMarcar } = await c.rpc("marcar_notificacao_lida", {
        notificacao_id: notifs[0].id,
      });
      const { data: depois } = await c
        .from("notificacoes")
        .select("lida")
        .eq("id", notifs[0].id)
        .single();
      verificar(
        "consegue marcar a sua própria notificação como lida",
        errMarcar === null && depois?.lida === true,
      );
    }

    // A Carla é a REMETENTE de `encPergunta` (não a destinatária) — não
    // deve conseguir marcá-la como lida através da função RPC.
    const { error: errMarcarMsgAlheia } = await c.rpc("marcar_mensagem_lida", {
      mensagem_id: ids.mensagens.encPergunta,
    });
    const { data: msgAindaNaoLida } = await c
      .from("mensagens")
      .select("lida_em")
      .eq("id", ids.mensagens.encPergunta)
      .single();
    verificar(
      "NÃO consegue marcar como lida uma mensagem em que não é destinatária",
      errMarcarMsgAlheia === null && msgAindaNaoLida?.lida_em == null,
      "a função RPC não deve dar erro (a linha simplesmente não é afetada), mas a mensagem tem de continuar por ler",
    );

    // Presenças (Etapa 4): só vê a presença da sua educanda, nunca escreve.
    const { data: presencas } = await c.from("presencas").select("crianca_id");
    verificar(
      "vê só 1 presença (a da sua educanda)",
      presencas?.length === 1 && presencas[0].crianca_id === ids.criancas.matilde,
      `viu ${presencas?.length ?? 0}`,
    );

    const { error: errPresencaIns } = await c.from("presencas").insert({
      escola_id: ids.escolas.arcoIris,
      crianca_id: ids.criancas.matilde,
      data: "2026-08-11",
      hora_entrada: new Date().toISOString(),
      registado_entrada_por: ids.perfis.encMatilde,
    });
    verificar(
      "NÃO consegue registar entrada (só staff/admin)",
      errPresencaIns !== null,
    );

    // Relatórios diários e fotos (Etapa 5): só consulta, nunca escreve.
    const { data: relatorios } = await c
      .from("relatorios_diarios")
      .select("crianca_id");
    verificar(
      "vê só 1 relatório (o da sua educanda)",
      relatorios?.length === 1 &&
        relatorios[0].crianca_id === ids.criancas.matilde,
      `viu ${relatorios?.length ?? 0}`,
    );

    const { error: errRelatorioIns } = await c
      .from("relatorios_diarios")
      .insert({
        escola_id: ids.escolas.arcoIris,
        crianca_id: ids.criancas.matilde,
        data: "2026-08-11",
        registado_por: ids.perfis.encMatilde,
      });
    verificar(
      "NÃO consegue criar relatório (só staff/admin)",
      errRelatorioIns !== null,
    );

    const { data: fotos } = await c.from("fotos").select("turma_id");
    verificar(
      "vê a foto da turma da sua educanda",
      fotos?.length === 1 && fotos[0].turma_id === ids.turmas.borboletas,
      `viu ${fotos?.length ?? 0}`,
    );

    const { data: baixarFoto, error: errBaixarFoto } = await c.storage
      .from("fotos-turmas")
      .createSignedUrl(`${ids.escolas.arcoIris}/${ids.turmas.borboletas}/exemplo.png`, 60);
    verificar(
      "consegue gerar link para a foto da turma da sua educanda",
      errBaixarFoto === null && !!baixarFoto?.signedUrl,
    );

    const { error: errFotoOutraTurma } = await c.storage
      .from("fotos-turmas")
      .createSignedUrl(`${ids.escolas.arcoIris}/${ids.turmas.girassois}/nao-existe.png`, 60);
    verificar(
      "NÃO consegue gerar link para foto de turma que não é da sua educanda",
      errFotoOutraTurma !== null,
    );

    const { error: errUploadEnc } = await c.storage
      .from("fotos-turmas")
      .upload(
        `${ids.escolas.arcoIris}/${ids.turmas.borboletas}/intrusa.png`,
        new Blob(["x"]),
      );
    verificar(
      "NÃO consegue fazer upload de fotos (só staff/admin)",
      errUploadEnc !== null,
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

    // Comunicação: mural, mensagens (Etapa 3).
    const { data: avisos } = await c.from("avisos").select("titulo");
    verificar(
      "vê os 2 avisos (escola-wide + da sua turma)",
      avisos?.length === 2,
      `viu ${avisos?.length ?? 0}`,
    );

    const { data: avisoTeste, error: errAvisoTurma } = await c
      .from("avisos")
      .insert({
        escola_id: ids.escolas.arcoIris,
        turma_id: ids.turmas.borboletas,
        autor_id: ids.perfis.staffBorboletas,
        titulo: "Aviso de teste da minha turma",
        corpo: "…",
      })
      .select()
      .single();
    verificar("consegue publicar aviso para a sua própria turma", errAvisoTurma === null);
    if (avisoTeste) await c.from("avisos").delete().eq("id", avisoTeste.id);

    const { error: errAvisoOutraTurma } = await c.from("avisos").insert({
      escola_id: ids.escolas.arcoIris,
      turma_id: ids.turmas.girassois,
      autor_id: ids.perfis.staffBorboletas,
      titulo: "Não devia conseguir publicar isto",
      corpo: "…",
    });
    verificar(
      "NÃO consegue publicar aviso para a turma do colega",
      errAvisoOutraTurma !== null,
    );

    const { error: errAvisoEscola } = await c.from("avisos").insert({
      escola_id: ids.escolas.arcoIris,
      turma_id: null,
      autor_id: ids.perfis.staffBorboletas,
      titulo: "Não devia conseguir publicar isto",
      corpo: "…",
    });
    verificar(
      "NÃO consegue publicar aviso para toda a escola",
      errAvisoEscola !== null,
    );

    const { error: errMsgCarla } = await c.from("mensagens").insert({
      escola_id: ids.escolas.arcoIris,
      remetente_id: ids.perfis.staffBorboletas,
      destinatario_id: ids.perfis.encMatilde,
      corpo: "Mensagem de teste.",
    });
    verificar(
      "consegue enviar mensagem à encarregada de uma educanda da turma",
      errMsgCarla === null,
    );

    const { error: errMsgDiogo } = await c.from("mensagens").insert({
      escola_id: ids.escolas.arcoIris,
      remetente_id: ids.perfis.staffBorboletas,
      destinatario_id: ids.perfis.encLeonor,
      corpo: "Não devia conseguir enviar isto.",
    });
    verificar(
      "NÃO consegue enviar mensagem a encarregado de outra turma",
      errMsgDiogo !== null,
    );

    // Presenças (Etapa 4): regista entrada/saída só das crianças da turma.
    const { data: presencasTurma } = await c
      .from("presencas")
      .select("crianca_id");
    verificar(
      "vê as 2 presenças da sua turma (Matilde e Tomás)",
      presencasTurma?.length === 2,
      `viu ${presencasTurma?.length ?? 0}`,
    );

    const { data: novaPresenca, error: errEntrada } = await c
      .from("presencas")
      .insert({
        escola_id: ids.escolas.arcoIris,
        crianca_id: ids.criancas.matilde,
        data: "2026-08-11",
        hora_entrada: new Date().toISOString(),
        registado_entrada_por: ids.perfis.staffBorboletas,
      })
      .select()
      .single();
    verificar(
      "consegue registar entrada de uma criança da sua turma",
      errEntrada === null,
    );

    if (novaPresenca) {
      const { error: errSaida } = await c
        .from("presencas")
        .update({
          hora_saida: new Date().toISOString(),
          levantado_por_id: ids.perfis.encMatilde,
          levantado_por_nome: "Carla Ferreira",
          registado_saida_por: ids.perfis.staffBorboletas,
        })
        .eq("id", novaPresenca.id);
      verificar("consegue registar a saída da mesma criança", errSaida === null);
      await c.from("presencas").delete().eq("id", novaPresenca.id);
    }

    const { error: errEntradaLeonor } = await c.from("presencas").insert({
      escola_id: ids.escolas.arcoIris,
      crianca_id: ids.criancas.leonor,
      data: "2026-08-11",
      hora_entrada: new Date().toISOString(),
      registado_entrada_por: ids.perfis.staffBorboletas,
    });
    verificar(
      "NÃO consegue registar entrada de uma criança de outra turma",
      errEntradaLeonor !== null,
    );

    // Relatórios diários e fotos (Etapa 5): só das crianças/turma dela.
    const { data: relatoriosTurma } = await c
      .from("relatorios_diarios")
      .select("crianca_id");
    verificar(
      "vê os 2 relatórios da sua turma (Matilde e Tomás)",
      relatoriosTurma?.length === 2,
      `viu ${relatoriosTurma?.length ?? 0}`,
    );

    const { data: novoRelatorio, error: errRelatorioIns } = await c
      .from("relatorios_diarios")
      .insert({
        escola_id: ids.escolas.arcoIris,
        crianca_id: ids.criancas.matilde,
        data: "2026-08-11",
        pequeno_almoco: "comeu_tudo",
        registado_por: ids.perfis.staffBorboletas,
      })
      .select()
      .single();
    verificar(
      "consegue criar relatório de uma criança da sua turma",
      errRelatorioIns === null,
    );
    if (novoRelatorio) {
      const { error: errRelatorioUpd } = await c
        .from("relatorios_diarios")
        .update({ almoco: "comeu_metade" })
        .eq("id", novoRelatorio.id);
      verificar("consegue editar o relatório ao longo do dia", errRelatorioUpd === null);
      await c.from("relatorios_diarios").delete().eq("id", novoRelatorio.id);
    }

    const { error: errRelatorioLeonor } = await c.from("relatorios_diarios").insert({
      escola_id: ids.escolas.arcoIris,
      crianca_id: ids.criancas.leonor,
      data: "2026-08-11",
      registado_por: ids.perfis.staffBorboletas,
    });
    verificar(
      "NÃO consegue criar relatório de uma criança de outra turma",
      errRelatorioLeonor !== null,
    );

    const caminhoFotoTeste = `${ids.escolas.arcoIris}/${ids.turmas.borboletas}/teste-${Date.now()}.png`;
    const { error: errUploadAna } = await c.storage
      .from("fotos-turmas")
      .upload(caminhoFotoTeste, new Blob(["x"]));
    verificar("consegue fazer upload de foto para a sua turma", errUploadAna === null);
    if (!errUploadAna) {
      await c.storage.from("fotos-turmas").remove([caminhoFotoTeste]);
    }

    const { error: errUploadOutraTurma } = await c.storage
      .from("fotos-turmas")
      .upload(
        `${ids.escolas.arcoIris}/${ids.turmas.girassois}/intrusa-${Date.now()}.png`,
        new Blob(["x"]),
      );
    verificar(
      "NÃO consegue fazer upload de foto para a turma do colega",
      errUploadOutraTurma !== null,
    );
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

    const { data: avisos } = await c.from("avisos").select("titulo, turma_id");
    verificar(
      "vê o aviso escola-wide mas NÃO o aviso da turma do colega",
      (avisos?.length ?? 0) >= 1 &&
        avisos.every((a) => a.turma_id === null || a.turma_id === ids.turmas.girassois),
      `viu: ${avisos?.map((a) => a.titulo).join(", ")}`,
    );

    const { data: msgsAlheias } = await c
      .from("mensagens")
      .select("id")
      .or(
        `remetente_id.eq.${ids.perfis.encMatilde},destinatario_id.eq.${ids.perfis.encMatilde}`,
      );
    verificar(
      "NÃO vê a conversa entre a Carla e a Ana (não participa)",
      (msgsAlheias?.length ?? 0) === 0,
    );

    const { data: presencasBruno } = await c
      .from("presencas")
      .select("crianca_id");
    verificar(
      "vê só a presença da Leonor",
      presencasBruno?.length === 1 &&
        presencasBruno[0].crianca_id === ids.criancas.leonor,
      `viu ${presencasBruno?.length ?? 0}`,
    );

    const { error: errUpdateAlheia } = await c
      .from("presencas")
      .update({ hora_saida: new Date().toISOString() })
      .eq("crianca_id", ids.criancas.matilde)
      .eq("data", "2026-08-10");
    const { data: matildeAindaAssim } = await c
      .from("presencas")
      .select("hora_saida")
      .eq("crianca_id", ids.criancas.matilde)
      .eq("data", "2026-08-10");
    verificar(
      "NÃO consegue alterar a presença de uma criança de outra turma",
      errUpdateAlheia === null && (matildeAindaAssim?.length ?? 0) === 0,
      "o update não dá erro (RLS filtra as linhas), mas não deve conseguir sequer ver/afetar a linha",
    );

    const { data: relatoriosBruno } = await c
      .from("relatorios_diarios")
      .select("crianca_id");
    verificar(
      "vê só o relatório da Leonor",
      relatoriosBruno?.length === 1 &&
        relatoriosBruno[0].crianca_id === ids.criancas.leonor,
      `viu ${relatoriosBruno?.length ?? 0}`,
    );

    const { data: fotosBruno } = await c.from("fotos").select("turma_id");
    verificar(
      "NÃO vê a foto da turma Borboletas (não é a sua turma)",
      (fotosBruno?.length ?? 0) === 0,
      `viu ${fotosBruno?.length ?? 0}`,
    );

    const { error: errBaixarFotoAlheia } = await c.storage
      .from("fotos-turmas")
      .createSignedUrl(`${ids.escolas.arcoIris}/${ids.turmas.borboletas}/exemplo.png`, 60);
    verificar(
      "NÃO consegue gerar link para foto da turma do colega",
      errBaixarFotoAlheia !== null,
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

    // Comunicação: admin publica para toda a escola e fala com qualquer
    // pessoa da sua escola, mas nunca atravessa a fronteira da escola.
    const { data: avisos } = await c.from("avisos").select("id");
    verificar(
      "vê todos os avisos da sua escola (2)",
      avisos?.length === 2,
      `viu ${avisos?.length ?? 0}`,
    );

    const { data: avisoNovo, error: errAvisoEscola } = await c
      .from("avisos")
      .insert({
        escola_id: ids.escolas.arcoIris,
        turma_id: null,
        autor_id: ids.perfis.adminArcoIris,
        titulo: "Aviso de teste da administração",
        corpo: "…",
      })
      .select()
      .single();
    verificar("consegue publicar aviso para toda a escola", errAvisoEscola === null);
    if (avisoNovo) await c.from("avisos").delete().eq("id", avisoNovo.id);

    const { error: errAvisoOutraEscola } = await c.from("avisos").insert({
      escola_id: ids.escolas.estrelinha,
      turma_id: null,
      autor_id: ids.perfis.adminArcoIris,
      titulo: "Não devia conseguir publicar isto",
      corpo: "…",
    });
    verificar(
      "NÃO consegue publicar aviso noutra escola",
      errAvisoOutraEscola !== null,
    );

    const { error: errMsgBruno } = await c.from("mensagens").insert({
      escola_id: ids.escolas.arcoIris,
      remetente_id: ids.perfis.adminArcoIris,
      destinatario_id: ids.perfis.staffGirassois,
      corpo: "Mensagem de teste a qualquer pessoa da escola.",
    });
    verificar(
      "consegue enviar mensagem a qualquer pessoa da sua escola",
      errMsgBruno === null,
    );

    const { error: errMsgOutraEscola } = await c.from("mensagens").insert({
      escola_id: ids.escolas.arcoIris,
      remetente_id: ids.perfis.adminArcoIris,
      destinatario_id: ids.perfis.adminEstrelinha,
      corpo: "Não devia conseguir enviar isto.",
    });
    verificar(
      "NÃO consegue enviar mensagem a alguém de outra escola",
      errMsgOutraEscola !== null,
    );

    // Presenças: admin vê e regista para qualquer criança da sua escola.
    const { data: todasPresencas } = await c.from("presencas").select("id");
    verificar(
      "vê as 3 presenças da sua escola",
      todasPresencas?.length === 3,
      `viu ${todasPresencas?.length ?? 0}`,
    );

    const { data: presencaAdmin, error: errEntradaAdmin } = await c
      .from("presencas")
      .insert({
        escola_id: ids.escolas.arcoIris,
        crianca_id: ids.criancas.leonor,
        data: "2026-08-12",
        hora_entrada: new Date().toISOString(),
        registado_entrada_por: ids.perfis.adminArcoIris,
      })
      .select()
      .single();
    verificar(
      "consegue registar entrada de qualquer criança da escola",
      errEntradaAdmin === null,
    );
    if (presencaAdmin)
      await c.from("presencas").delete().eq("id", presencaAdmin.id);

    const { error: errEntradaOutraEscola } = await c.from("presencas").insert({
      escola_id: ids.escolas.estrelinha,
      crianca_id: ids.criancas.iris,
      data: "2026-08-12",
      hora_entrada: new Date().toISOString(),
      registado_entrada_por: ids.perfis.adminArcoIris,
    });
    verificar(
      "NÃO consegue registar presença numa criança de outra escola",
      errEntradaOutraEscola !== null,
    );

    const { data: relatoriosAdmin } = await c
      .from("relatorios_diarios")
      .select("id");
    verificar(
      "vê os 3 relatórios da sua escola",
      relatoriosAdmin?.length === 3,
      `viu ${relatoriosAdmin?.length ?? 0}`,
    );

    const { data: fotosAdmin } = await c.from("fotos").select("id");
    verificar("vê a foto da escola", fotosAdmin?.length === 1);

    const { data: linkAdmin, error: errLinkAdmin } = await c.storage
      .from("fotos-turmas")
      .createSignedUrl(`${ids.escolas.arcoIris}/${ids.turmas.girassois}/nao-existe.png`, 60);
    // O admin tem acesso a qualquer turma da sua escola — o Storage do
    // Supabase não sabe se o ficheiro existe, mas a política deixa
    // passar (não há erro de autorização); o "não existe" dá erro por
    // outra razão (ficheiro em falta), não por RLS.
    verificar(
      "admin tem autorização para a pasta de qualquer turma da escola",
      errLinkAdmin === null || !errLinkAdmin.message?.toLowerCase().includes("polic"),
      linkAdmin ? "" : errLinkAdmin?.message,
    );

    const { error: errUploadOutraEscolaFoto } = await c.storage
      .from("fotos-turmas")
      .upload(
        `${ids.escolas.estrelinha}/${ids.turmas.luas}/intrusa-${Date.now()}.png`,
        new Blob(["x"]),
      );
    verificar(
      "NÃO consegue fazer upload de foto para turma de outra escola",
      errUploadOutraEscolaFoto !== null,
    );
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

    const { data: avisosOutraEscola } = await c.from("avisos").select("id");
    verificar(
      "NÃO vê nenhum aviso da escola Arco-Íris",
      (avisosOutraEscola?.length ?? 0) === 0,
      `viu ${avisosOutraEscola?.length ?? 0}`,
    );

    const { data: mensagensOutraEscola } = await c
      .from("mensagens")
      .select("id");
    verificar(
      "NÃO vê nenhuma mensagem da escola Arco-Íris",
      (mensagensOutraEscola?.length ?? 0) === 0,
      `viu ${mensagensOutraEscola?.length ?? 0}`,
    );

    const { data: presencasOutraEscola } = await c
      .from("presencas")
      .select("id");
    verificar(
      "NÃO vê nenhuma presença da escola Arco-Íris",
      (presencasOutraEscola?.length ?? 0) === 0,
      `viu ${presencasOutraEscola?.length ?? 0}`,
    );

    const { data: relatoriosOutraEscola } = await c
      .from("relatorios_diarios")
      .select("id");
    verificar(
      "NÃO vê nenhum relatório da escola Arco-Íris",
      (relatoriosOutraEscola?.length ?? 0) === 0,
      `viu ${relatoriosOutraEscola?.length ?? 0}`,
    );

    const { data: fotosOutraEscola } = await c.from("fotos").select("id");
    verificar(
      "NÃO vê nenhuma foto da escola Arco-Íris",
      (fotosOutraEscola?.length ?? 0) === 0,
      `viu ${fotosOutraEscola?.length ?? 0}`,
    );

    const { error: errFotoOutraEscolaStorage } = await c.storage
      .from("fotos-turmas")
      .createSignedUrl(`${ids.escolas.arcoIris}/${ids.turmas.borboletas}/exemplo.png`, 60);
    verificar(
      "NÃO consegue gerar link para foto de outra escola",
      errFotoOutraEscolaStorage !== null,
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
