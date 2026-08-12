/**
 * Versão atual dos termos/política de privacidade. Mudar esta string
 * (ex. para uma data nova) obriga TODAS as contas a aceitar de novo no
 * próximo acesso — usar só quando o texto mudar de forma relevante.
 */
export const VERSAO_TERMOS_ATUAL = "2026-08-12";

export const PONTOS_TERMOS = [
  {
    titulo: "Que dados guardamos",
    texto:
      "Dados da criança (identificação, saúde, quem a pode levantar), fotos das atividades da turma, e as suas mensagens e presenças na aplicação.",
  },
  {
    titulo: "Quem vê o quê",
    texto:
      "Cada encarregado de educação só vê os dados dos seus próprios educandos. O staff só vê as crianças das suas turmas. Nunca há partilha entre escolas.",
  },
  {
    titulo: "Onde ficam guardados",
    texto:
      "Em servidores na União Europeia, através do Supabase, protegidos por regras de acesso ao nível da base de dados (não é só a aplicação a decidir quem vê o quê).",
  },
  {
    titulo: "Os seus direitos",
    texto:
      "Pode consultar, corrigir ou pedir o apagamento dos dados a qualquer momento, contactando a escola diretamente.",
  },
  {
    titulo: "Fotos",
    texto:
      "A autorização específica para fotos da sua criança é tratada separadamente pela escola, no processo de matrícula — esta aceitação cobre apenas a utilização geral da aplicação.",
  },
] as const;
