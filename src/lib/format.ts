import type { InvestmentType, PaymentMethod } from "./types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

export const money = (value: number) => brl.format(value || 0);
export const percent = (ratio: number) => pct.format(Number.isFinite(ratio) ? ratio : 0);

export function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** Aceita "1.234,56", "1234,56" e "1234.56". */
export function parseAmount(raw: FormDataEntryValue | null): number {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(/[R$\s]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  return Math.round(Number(s) * 100) / 100;
}

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  pix: "Pix",
  debit: "Débito",
  cash: "Dinheiro",
  credit_card: "Cartão de crédito",
  boleto: "Boleto",
  transfer: "Transferência",
  other: "Outro",
};

export const INVESTMENT_TYPES: Record<InvestmentType, string> = {
  reserva: "Reserva de emergência",
  renda_fixa: "Renda fixa (CDB, LCI, LCA)",
  tesouro: "Tesouro Direto",
  acoes: "Ações",
  fii: "Fundos imobiliários",
  fundos: "Fundos de investimento",
  cripto: "Criptomoedas",
  previdencia: "Previdência",
  exterior: "Exterior",
  outros: "Outros",
};

export const INVESTMENT_COLORS: Record<InvestmentType, string> = {
  reserva: "#0ea5e9",
  renda_fixa: "#6366f1",
  tesouro: "#16a34a",
  acoes: "#f97316",
  fii: "#a16207",
  fundos: "#8b5cf6",
  cripto: "#eab308",
  previdencia: "#14b8a6",
  exterior: "#ec4899",
  outros: "#94a3b8",
};
