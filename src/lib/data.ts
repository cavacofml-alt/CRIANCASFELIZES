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

/**
 * Formatadores de hora/data sempre no fuso de Portugal, nunca no fuso
 * do ambiente onde o código corre — o browser do utilizador já usa a
 * hora local certa, mas os componentes de servidor (Next.js) correm na
 * Vercel em UTC, o que dava horas erradas (ex.: 1h a menos em agosto).
 */
export function formatarHoraPT(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon",
  });
}

export function formatarDataPT(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", {
    timeZone: "Europe/Lisbon",
  });
}

export function formatarDataExtensaPT(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Lisbon",
  });
}

export function formatarDataHoraPT(iso: string) {
  return new Date(iso).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" });
}
