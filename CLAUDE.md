# CriancasFelizes — CLAUDE.md

## Objetivo do projeto
Construir uma aplicação web inspirada no EducaBiz para gestão de creches/escolas: comunicação
escola-família, presenças (check-in/check-out), relatórios diários e fotos, e mensalidades.
Estrutura moderna, animada e colorida. Usar apenas ferramentas com camada gratuita, sem custos
fixos, com possibilidade futura de evoluir para SaaS multi-escola.

## Contexto e restrições importantes
- O dono do projeto **não tem conhecimento técnico**. O Claude Code deve fazer todo o trabalho de
  código e, quando for necessária uma ação externa (criar conta, gerar chave API, aprovar deploy,
  configurar domínio), deve **parar e pedir explicitamente** ao utilizador, com instruções passo a
  passo, nunca assumir que foi feito.
- Este produto vai lidar, mais tarde, com **dados reais de crianças** (nomes, fotos, saúde,
  presenças, quem as busca) de uma escola real. Isto é dado sensível de menores. Até isso ser
  explicitamente autorizado (ver Etapa 8), **todo o desenvolvimento e testes usam apenas dados
  fictícios**.
- Ambição declarada: começar como piloto numa escola, com possibilidade de evoluir para vender a
  várias escolas (SaaS). Decisões de arquitetura devem considerar isto mas não devem
  sobre-engenherizar antes de a v1 funcionar.

## Regra fundamental de execução por etapas
**As etapas abaixo devem ser executadas SEPARADAMENTE. O Claude Code não deve avançar para a
etapa seguinte sem autorização explícita do utilizador**, mesmo que a etapa atual pareça
concluída com sucesso. No fim de cada etapa: resumir o que foi feito, como verificar, e perguntar
se pode avançar.

## Stack tecnológica
- **Frontend/Backend**: Next.js (App Router), TypeScript, Tailwind CSS + biblioteca de animação
  leve (ex. Framer Motion)
- **Base de dados / Auth / Storage**: Supabase (Postgres + Auth + Storage + Row Level Security)
  — free tier
- **Hosting**: Vercel — free tier
- **Pagamentos** (só na Etapa 9): Stripe Checkout (hospedado — nunca guardar dados de cartão
  diretamente)
- **Controlo de versão**: GitHub, branch de trabalho conforme instrução ativa da sessão

Não introduzir serviços pagos, dependências desnecessárias ou infraestrutura própria (servidores,
containers geridos manualmente) sem discutir primeiro com o utilizador.

## Etapas do projeto (executar uma de cada vez, com aprovação entre elas)

0. **Setup de contas externas** — GitHub, Supabase, Vercel criados e ligados pelo utilizador,
   guiado passo a passo pelo Claude Code.
1. **Fundação técnica** — scaffolding Next.js, ligação ao Supabase, primeiro deploy no Vercel.
2. **Modelo de dados + Auth (dados fictícios)** — schema (escolas, turmas, crianças,
   encarregados, staff), Row Level Security por papel, login funcional para 3 papéis
   (admin/staff/encarregado de educação).
3. **Comunicação escola-família** — mural de avisos, mensagens diretas, notificações in-app.
4. **Presenças** — check-in/check-out, registo de quem levantou a criança.
5. **Relatórios diários e fotos** — refeições, sono, fraldas, upload de fotos por turma, visíveis
   apenas ao encarregado correspondente.
6. **UI/UX final** — identidade visual moderna, cor, animações, aplicadas a todas as
   funcionalidades já construídas.
7. **Auditoria de segurança e RGPD** — teste adversarial de RLS, política de privacidade,
   documento de consentimento para a escola/encarregados, plano de backup e retenção de dados.
   Etapa obrigatória e bloqueante antes de qualquer dado real.
8. **Migração para dados reais (piloto)** — só após Etapa 7 aprovada e consentimento assinado da
   escola. Ativação de dados reais na escola piloto.
9. **Pagamentos/mensalidades** — integração Stripe Checkout, sem armazenamento de dados de
   cartão.
10. **Preparação multi-tenant** (opcional, só se o utilizador decidir escalar) — isolamento entre
    escolas, onboarding de novas escolas.

## Padrões de trabalho
- Nunca escrever ou testar com dados reais de crianças antes da Etapa 8.
- Toda a lógica que decide "quem pode ver o quê" (RLS, checks de autorização) é tratada como
  código crítico: preferir esforço/modelo mais rigoroso e pedir revisão extra antes de avançar.
- Explicar decisões técnicas em linguagem simples, já que o utilizador não tem background técnico.
- Não assumir que uma conta/serviço externo está configurado — confirmar com o utilizador.
- Não adicionar funcionalidades fora do que foi combinado em cada etapa.
- Commits pequenos e descritivos, um por unidade de trabalho coerente.

## Critérios de conclusão por etapa
Uma etapa só é considerada concluída quando:
1. O resultado esperado da etapa (ver tabela acima) está implementado e a correr.
2. O utilizador verificou pessoalmente (ou o Claude Code demonstrou) o comportamento descrito na
   coluna "como verificar" do plano de execução.
3. Não há dados reais de crianças envolvidos, exceto a partir da Etapa 8.
4. O utilizador deu autorização explícita para avançar para a etapa seguinte.

## O que NÃO fazer sem autorização explícita
- Não ativar dados reais de crianças antes da Etapa 8.
- Não introduzir custos (planos pagos, domínios, gateways de pagamento fora do sandbox).
- Não fazer deploy para produção com acesso público antes da Etapa 7 (auditoria) estar concluída.
- Não avançar etapas sem confirmação do utilizador.
