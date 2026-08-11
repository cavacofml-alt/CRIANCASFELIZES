/**
 * Data de hoje no formato YYYY-MM-DD, no fuso horário de Portugal —
 * nunca `new Date().toISOString()`, que usa UTC e pode dar o dia
 * errado perto da meia-noite (o servidor da Vercel corre em UTC).
 */
export function hojeISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(
    new Date(),
  );
}
