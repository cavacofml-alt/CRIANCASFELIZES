# Plano de Backup e Retenção de Dados — Crianças Felizes

> Documento técnico da Etapa 7 (auditoria de segurança e RGPD). Descreve
> como os dados são copiados de segurança (backup) e durante quanto tempo
> são guardados antes de serem apagados (retenção). Escrito enquanto o
> projeto ainda só usa dados fictícios; os prazos de retenção propostos
> devem ser confirmados pela Escola (e, idealmente, por um jurista) antes
> da Etapa 8, porque podem existir obrigações legais específicas do setor
> (educação de infância) que exijam prazos diferentes dos aqui sugeridos.

## 1. Onde os dados estão guardados

- **Base de dados e ficheiros (fotos)**: Supabase, plano gratuito, servidor
  na União Europeia (região [Irlanda ou Frankfurt] — a confirmar a região
  exata escolhida na conta Supabase antes da Etapa 8).
- **Aplicação web**: Vercel, plano gratuito. A Vercel não guarda dados de
  crianças — só serve o código da aplicação; os dados vêm sempre do
  Supabase, pedidos em tempo real por cada utilizador autenticado.

## 2. Backup (cópia de segurança)

O plano gratuito do Supabase **não inclui backups automáticos geridos**
(essa funcionalidade só existe em planos pagos). Isto significa que, no
estado atual (Etapa 7), se a base de dados for apagada ou corrompida por
engano, não há uma cópia de recuperação automática.

Para a Etapa 8 (dados reais), propomos uma de duas opções — a decidir com
o utilizador antes de qualquer dado real ser introduzido:

1. **Backup manual periódico (sem custo)**: exportar a base de dados
   regularmente (ex. semanalmente) usando a ferramenta `pg_dump` do
   Supabase, e guardar o ficheiro exportado num local seguro (ex. conta
   Google Drive privada da Escola). Requer disciplina de o fazer
   manualmente ou agendado.
2. **Upgrade ao plano pago do Supabase (Pro, ~25 USD/mês)**: inclui
   backups diários automáticos geridos pela Supabase durante 7 dias. Só
   deve ser considerado se e quando a Escola decidir que o custo se
   justifica — nunca ativado sem discussão prévia, conforme regra do
   projeto de não introduzir custos sem autorização.

**Recomendação**: começar com a opção 1 (backup manual, sem custo) na
Etapa 8, e revisitar a opção 2 se o número de crianças/dados crescer o
suficiente para justificar o custo.

Fotos ficam no Supabase Storage, incluídas no mesmo mecanismo de backup
escolhido.

## 3. Prazos de retenção propostos

| Tipo de dado | Prazo proposto | Nota |
|---|---|---|
| Dados de identificação e saúde da criança | Enquanto a criança frequentar a Escola + [X] anos após a saída | Prazo exato depende de eventual obrigação legal do setor — confirmar com a Escola/jurista |
| Registos de presença (check-in/check-out) | [1 a 2 anos] | Prazo típico de registos administrativos escolares — a confirmar |
| Relatórios diários (refeições, sono, fraldas) | [6 meses a 1 ano] após o dia do registo | Dado operacional do dia-a-dia, não precisa de ficar indefinidamente |
| Fotos | Enquanto a criança frequentar a Escola; apagadas [X meses] após a saída, salvo pedido da família para manter | A família pode pedir apagamento antes disso a qualquer momento |
| Mensagens e avisos do mural | [1 ano] | |
| Contas de utilizador (login) desativadas | Apagadas [X meses] após deixarem de estar associadas a uma criança ativa | |

*(Os valores entre `[colchetes]` são propostas de ponto de partida, não
prazos definitivos — devem ser confirmados antes da Etapa 8.)*

## 4. Como o apagamento será feito

Na Etapa 7 ainda não existe uma funcionalidade automática de apagamento por
prazo — os dados são fictícios e recriados/apagados manualmente durante o
desenvolvimento. Antes da Etapa 8, propomos construir:

- Um processo (manual, no início) para a Escola pedir o apagamento dos
  dados de uma criança que saiu, cumprindo os prazos da secção 3.
- Um processo para responder a pedidos de apagamento antecipado feitos
  pelos encarregados de educação (direito RGPD, ver `POLITICA_PRIVACIDADE.md`
  secção 6).

Automatizar o apagamento por prazo (ex. tarefa agendada) é uma melhoria
futura, não bloqueante para o piloto — pode ser feito manualmente no
início, dado o número reduzido de crianças de uma escola-piloto.

## 5. O que fazer em caso de incidente de segurança

Ainda que não seja obrigatório detalhar isto na Etapa 7 (não houve
nenhum incidente), fica registada a intenção: caso se detete um acesso
indevido a dados reais (após a Etapa 8), a Escola deve ser informada de
imediato, e — se se confirmar exposição de dados pessoais de crianças — a
CNPD deve ser notificada nos prazos legais (regra geral, 72 horas). Este
plano de resposta a incidentes deve ser detalhado com mais rigor antes da
Etapa 8.
