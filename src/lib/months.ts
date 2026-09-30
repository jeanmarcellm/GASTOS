/** Utilitários de mês no formato "YYYY-MM", sempre no fuso de São Paulo. */

const TZ = "America/Sao_Paulo";

export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function currentMonth(): string {
  return todayISO().slice(0, 7);
}

export function parseMonth(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : currentMonth();
}

export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

/** "2026-09" -> "2026-09-01" (formato das colunas date do banco). */
export const monthStart = (ym: string) => `${ym}-01`;

/** "2026-09-01" -> "2026-09" */
export const toYm = (isoDate: string) => isoDate.slice(0, 7);

export function monthRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let m = from; m <= to; m = addMonths(m, 1)) out.push(m);
  return out;
}

export function daysInMonth(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function monthLabel(ym: string, style: "long" | "short" = "long"): string {
  const [y, m] = ym.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, 15));
  if (style === "short") {
    const mon = date.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "");
    return `${mon}/${String(y).slice(2)}`;
  }
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Mês da fatura (mês de vencimento) em que cai uma compra no cartão.
 * Compras feitas no dia do fechamento ou depois entram na fatura seguinte.
 */
export function invoiceMonth(purchaseDate: string, closingDay: number, dueDay: number): string {
  const day = Number(purchaseDate.slice(8, 10));
  let closing = toYm(purchaseDate);
  if (day >= closingDay) closing = addMonths(closing, 1);
  return dueDay > closingDay ? closing : addMonths(closing, 1);
}
