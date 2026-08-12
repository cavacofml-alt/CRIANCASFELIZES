# Política de Privacidade — [NOME DA ESCOLA]

> **DOCUMENTO MODELO — POR PREENCHER ANTES DE USO REAL.**
> Este documento é um modelo, escrito para a Etapa 7 do projeto Crianças
> Felizes, enquanto a aplicação ainda só usa dados fictícios. Todos os
> campos entre `[colchetes]` têm de ser preenchidos com a informação real
> da escola antes de este documento poder ser mostrado a encarregados de
> educação verdadeiros (Etapa 8). Não é aconselhamento jurídico — antes de
> usar este documento com dados reais, a escola deve confirmá-lo com um
> jurista ou um DPO (Encarregado de Proteção de Dados), especialmente
> porque trata dados de menores.

Última atualização: [DATA]

## 1. Quem somos

A aplicação Crianças Felizes é usada por **[NOME DA ESCOLA]**
([morada], [NIF], doravante "a Escola") para gerir a comunicação com as
famílias, presenças, relatórios diários e fotos das crianças matriculadas.

Responsável pelo tratamento de dados: [NOME DA ESCOLA / RESPONSÁVEL LEGAL]
Contacto: [email de contacto] · [telefone]
Encarregado de Proteção de Dados (se aplicável): [nome / contacto, ou "não
aplicável — escola de pequena dimensão"]

## 2. Que dados tratamos

| Categoria | Exemplos | Quem introduz |
|---|---|---|
| Dados de identificação da criança | nome, data de nascimento, turma | Escola |
| Dados de saúde e cuidados | alergias, medicação, sono, refeições, fraldas | Escola |
| Dados de quem levanta a criança | nome de encarregados de educação e de outras pessoas autorizadas | Escola / Encarregado |
| Fotos | fotos tiradas durante atividades da turma | Escola |
| Dados de contacto de encarregados de educação | nome, email, telefone | Encarregado |
| Comunicações | avisos do mural, mensagens diretas com a Escola | Escola / Encarregado |
| Dados de acesso | registo de login, data/hora de check-in e check-out | Sistema |

Não recolhemos dados de pagamento diretamente (ver secção 8).

## 3. Para que usamos estes dados

- Gerir a frequência da criança (check-in/check-out, quem a levantou).
- Comunicar com os encarregados de educação (avisos, mensagens diretas).
- Registar e partilhar relatórios diários (refeições, sono, fraldas) e
  fotos, visíveis apenas ao encarregado de educação correspondente.
- Cumprir obrigações legais da Escola enquanto estabelecimento de
  educação/cuidado de crianças.

Não usamos os dados para publicidade, não os vendemos, e não os partilhamos
com terceiros fora do necessário para o funcionamento do serviço (ver
secção 4).

## 4. Com quem partilhamos os dados

Os dados são alojados por fornecedores de tecnologia que atuam como
subcontratantes da Escola, sob contrato/termos de serviço próprios:

- **Supabase** (base de dados, autenticação e armazenamento de ficheiros) —
  dados alojados em servidores na União Europeia ([Irlanda/Frankfurt] — a
  confirmar a região definitiva com o Supabase antes da Etapa 8).
- **Vercel** (alojamento da aplicação web) — pode processar dados de
  tráfego técnico (ex. endereço IP) na entrega das páginas.

Não existe partilha de dados com outras entidades fora destas duas, salvo
obrigação legal (ex. pedido de uma autoridade competente).

## 5. Quanto tempo guardamos os dados

Ver documento separado `BACKUP_E_RETENCAO.md` para os prazos concretos de
retenção e apagamento de cada tipo de dado.

## 6. Os direitos dos encarregados de educação

Nos termos do RGPD, o encarregado de educação (em nome da criança) tem
direito a:

- Aceder aos dados que temos sobre a criança.
- Pedir a correção de dados incorretos.
- Pedir o apagamento dos dados (com os limites de obrigações legais de
  registo que a Escola tenha de manter).
- Pedir a portabilidade dos dados (cópia num formato comum).
- Opor-se a determinados tratamentos, quando aplicável.
- Apresentar reclamação à Comissão Nacional de Proteção de Dados (CNPD),
  em www.cnpd.pt.

Pedidos devem ser feitos para: [email de contacto da Escola].

## 7. Fotos das crianças

As fotos publicadas na aplicação são visíveis **apenas** ao(s) encarregado(s)
de educação da criança em causa, nunca a outras famílias. A recolha e
publicação de fotos de cada criança depende de consentimento prévio,
assinado no momento da matrícula (ver `CONSENTIMENTO.md`), que pode ser
retirado a qualquer momento.

## 8. Pagamentos (etapa futura)

Quando a funcionalidade de mensalidades for ativada (Etapa 9), os
pagamentos serão processados através do Stripe Checkout, um serviço externo
especializado. A Escola e a aplicação Crianças Felizes **nunca** guardam
números de cartão de crédito ou dados bancários diretamente.

## 9. Segurança

Os dados estão protegidos por controlo de acesso: cada pessoa só vê os
dados a que tem direito consoante o seu papel (encarregado de educação,
staff, administração), reforçado por regras de segurança ao nível da base
de dados. Ver `AUDITORIA_SEGURANCA.md` para o resumo da revisão de
segurança feita antes de qualquer dado real.

## 10. Alterações a esta política

Esta política pode ser atualizada; a versão em vigor estará sempre
disponível na aplicação. Alterações relevantes serão comunicadas aos
encarregados de educação.
