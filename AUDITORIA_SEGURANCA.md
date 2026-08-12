# Auditoria de Segurança — Etapa 7

Antes de qualquer dado real de uma criança entrar na aplicação (Etapa 8), o
projeto passou por uma revisão adversarial de segurança, focada nas regras
que decidem "quem pode ver/alterar o quê" (Row Level Security / RLS) — o
mecanismo que impede um encarregado de educação de ver dados de outra
criança, ou uma escola de ver dados de outra escola.

Esta revisão foi feita por um segundo modelo de IA, com instruções
específicas para tentar encontrar falhas (não para confirmar que estava
tudo bem), lendo as 17 migrations do projeto uma a uma, os scripts de
teste e o código da aplicação que escreve na base de dados.

## Resultado em linguagem simples

**Nenhuma falha encontrada permitia, hoje, sem intervenção de um
administrador, que uma família ou um staff visse dados de outra
criança/turma/escola.** O desenho geral (isolar tudo por escola, negar por
omissão) estava correto.

Foram encontrados **7 problemas reais** que exigiam correção antes da
Etapa 8 — a maioria não deixava ninguém ver dados indevidos, mas deixava
**alterar** registos sensíveis de forma indevida, ou continha um risco de
a aplicação parar de funcionar por um caminho de ficheiro mal formado.
Todos foram corrigidos na migration `0018_auditoria_seguranca_correcoes.sql`
e cobertos por novos testes automáticos.

## Os problemas encontrados e como foram corrigidos

| # | Problema (em linguagem simples) | Risco | Corrigido? |
|---|---|---|---|
| 1 | Um membro do staff podia editar um registo de presença antigo e atribuir a "quem registou a saída da criança" a outro colega, sem ser esse colega. | Um registo de segurança infantil (quem levantou a criança, confirmado por quem) podia ser falsificado. | ✅ Sim — agora esse campo fica fixo depois de definido, exceto correção por um admin. |
| 2 | O mesmo problema no autor de um relatório diário (refeições, sono, fraldas — nota: pode incluir informação de saúde). | Uma nota podia ficar assinada por outra pessoa. | ✅ Sim, mesma correção. |
| 3 | Ao atribuir um membro do staff a uma turma, o sistema não confirmava que essa pessoa era mesmo staff dessa escola. | Um erro de administração podia ligar uma pessoa errada (outra escola, ou outro papel) a uma turma. | ✅ Sim — agora é sempre verificado. |
| 4 | Uma dessas atribuições erradas (problema 3) podia, em cadeia, deixar essa pessoa ver a lista de "quem pode levantar cada criança" da escola errada. | Consequência do problema 3 — informação sensível exposta por engano administrativo, não por um ataque direto. | ✅ Sim — corrigido na fonte (problema 3) e com uma segunda camada de proteção nas funções internas. |
| 5 | Ao ligar um encarregado de educação a uma criança, o sistema não confirmava que essa pessoa era mesmo encarregado de educação dessa escola. | Mesmo tipo de erro do problema 3, do outro lado da ligação. | ✅ Sim — agora é sempre verificado. |
| 6 | A camada de permissões "básica" da base de dados (antes mesmo de chegar às regras detalhadas) não estava tão fechada quanto os comentários do código diziam — não havia impacto prático hoje, mas dependia de uma segunda camada não estar realmente a proteger nada. | Nenhum, hoje — mas o princípio de "duas camadas de proteção independentes" não estava verdadeiro. | ✅ Sim — fechada explicitamente. |
| 7 | Um caminho de ficheiro mal formado (nome de pasta que não é um identificador válido) podia, em teoria, fazer a galeria de fotos parar de funcionar para toda a escola. | Indisponibilidade, não fuga de dados. | ✅ Sim — caminhos inválidos são agora recusados de forma controlada. |

Foram também corrigidos, por prudência, dois detalhes menores sem risco
prático: uma função interna que não seguia o mesmo padrão de segurança das
restantes (só por consistência), e a validação de que o caminho de uma
foto guardado na base de dados corresponde mesmo à turma/escola indicada.

## O que NÃO foi encontrado

- Nenhuma forma de um encarregado de educação ver dados de outra criança.
- Nenhuma forma de atravessar a fronteira entre escolas para ler dados.
- Nenhuma forma de um utilizador se promover a administrador.
- As funções internas de segurança (as que decidem "que escola/turma/
  crianças pertencem a este utilizador") estavam corretamente protegidas
  contra utilização indevida.

## O que ainda falta (registado, não bloqueante para o piloto)

- **Não existe ainda um registo de auditoria** (quem alterou o quê e
  quando) para além dos campos de autoria já existentes. Para uma
  escola-piloto pequena não é bloqueante, mas é uma melhoria a considerar
  antes de crescer para mais escolas.
- **Testes adversariais foram estendidos** para cobrir os cenários desta
  auditoria (falsificação de autoria, atribuições cruzadas entre escolas,
  caminhos de Storage inválidos, escrita direta sem política), mas nem
  todos os cenários possíveis foram automatizados — a rotina recomendada
  é voltar a esta lista sempre que uma nova funcionalidade crítica
  (presenças, relatórios, mensagens) for adicionada.
- **Rotação da chave `service_role`** continua pendente (decisão já
  adiada anteriormente) — deve ser feita antes da Etapa 8.

## Como isto foi aplicado

Tal como todas as alterações à base de dados neste projeto, a correção foi
feita através de uma migration SQL (`0018_auditoria_seguranca_correcoes.sql`)
que o utilizador colou no editor SQL do Supabase, e os testes automáticos
(`npm run test:rls`) foram corridos com sucesso depois de aplicada.
