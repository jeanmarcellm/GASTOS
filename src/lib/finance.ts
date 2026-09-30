import type { FinanceData } from "./data";
import { addMonths, monthRange, monthStart, toYm } from "./months";
import type { Category, CreditCard, FixedExpense, Transaction } from "./types";

export const UNCATEGORIZED = { id: "none", name: "Sem categoria", color: "#cbd5e1" };

const sum = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;

export function isFixedActiveIn(fe: FixedExpense, ym: string) {
  return toYm(fe.start_month) <= ym && (!fe.end_month || toYm(fe.end_month) >= ym);
}

export type FixedItem = {
  expense: FixedExpense;
  paid: boolean;
  paymentId: string | null;
  amount: number;
};

export type CategoryTotal = {
  id: string;
  name: string;
  color: string;
  total: number;
  budget: number | null;
  nature: Category["nature"];
};

export type MonthSummary = {
  ym: string;
  salary: number;
  extraIncome: number;
  income: number;
  fixedTotal: number;
  cardTotal: number;
  otherTotal: number;
  expenses: number;
  balance: number;
  savingsRate: number;
  essential: number;
  lifestyle: number;
  fixedItems: FixedItem[];
  expenseTx: Transaction[];
  incomeTx: Transaction[];
  byCategory: CategoryTotal[];
};

export function monthSummary(data: FinanceData, ym: string): MonthSummary {
  const month = monthStart(ym);
  const tx = data.transactions.filter((t) => t.reference_month === month);
  const expenseTx = tx.filter((t) => t.kind === "expense");
  const incomeTx = tx.filter((t) => t.kind === "income");

  const fixedItems: FixedItem[] = data.fixed
    .filter((fe) => isFixedActiveIn(fe, ym))
    .map((fe) => {
      const payment = data.payments.find((p) => p.fixed_expense_id === fe.id && p.month === month);
      return {
        expense: fe,
        paid: Boolean(payment),
        paymentId: payment?.id ?? null,
        amount: payment ? payment.amount : fe.amount,
      };
    });

  const fixedTotal = sum(fixedItems.map((f) => f.amount));
  const cardTotal = sum(expenseTx.filter((t) => t.payment_method === "credit_card").map((t) => t.amount));
  const otherTotal = sum(expenseTx.filter((t) => t.payment_method !== "credit_card").map((t) => t.amount));
  const salary = data.profile.monthly_income;
  const extraIncome = sum(incomeTx.map((t) => t.amount));
  const income = sum([salary, extraIncome]);
  const expenses = sum([fixedTotal, cardTotal, otherTotal]);
  const balance = sum([income, -expenses]);

  const catMap = new Map(data.categories.map((c) => [c.id, c]));
  const totals = new Map<string, number>();
  const add = (categoryId: string | null, amount: number) => {
    const key = categoryId && catMap.has(categoryId) ? categoryId : UNCATEGORIZED.id;
    totals.set(key, (totals.get(key) ?? 0) + amount);
  };
  fixedItems.forEach((f) => add(f.expense.category_id, f.amount));
  expenseTx.forEach((t) => add(t.category_id, t.amount));

  const byCategory: CategoryTotal[] = [...totals.entries()]
    .map(([id, total]) => {
      const c = catMap.get(id);
      return {
        id,
        name: c?.name ?? UNCATEGORIZED.name,
        color: c?.color ?? UNCATEGORIZED.color,
        total: Math.round(total * 100) / 100,
        budget: c?.monthly_budget ?? null,
        nature: c?.nature ?? null,
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    ym,
    salary,
    extraIncome,
    income,
    fixedTotal,
    cardTotal,
    otherTotal,
    expenses,
    balance,
    savingsRate: income > 0 ? balance / income : 0,
    essential: sum(byCategory.filter((c) => c.nature === "essential").map((c) => c.total)),
    lifestyle: sum(byCategory.filter((c) => c.nature === "lifestyle").map((c) => c.total)),
    fixedItems,
    expenseTx,
    incomeTx,
    byCategory,
  };
}

/** Resumos dos `count` meses terminando em `ym` (inclusive), do mais antigo ao mais novo. */
export function monthSeries(data: FinanceData, ym: string, count: number): MonthSummary[] {
  return monthRange(addMonths(ym, -(count - 1)), ym).map((m) => monthSummary(data, m));
}

export type CardStatus = {
  card: CreditCard;
  invoice: Transaction[];
  invoiceTotal: number;
  /** Tudo que ainda vai ser cobrado a partir da fatura de `ym` (compromete o limite). */
  outstanding: number;
  available: number;
  usage: number;
};

export function cardStatus(data: FinanceData, card: CreditCard, ym: string): CardStatus {
  const month = monthStart(ym);
  const cardTx = data.transactions.filter((t) => t.credit_card_id === card.id);
  const invoice = cardTx.filter((t) => t.reference_month === month);
  const outstanding = sum(cardTx.filter((t) => t.reference_month >= month).map((t) => t.amount));
  return {
    card,
    invoice,
    invoiceTotal: sum(invoice.map((t) => t.amount)),
    outstanding,
    available: Math.max(0, card.credit_limit - outstanding),
    usage: card.credit_limit > 0 ? outstanding / card.credit_limit : 0,
  };
}

/** Total de parcelas de cartão já comprometidas em cada um dos próximos `count` meses. */
export function futureInstallments(data: FinanceData, ym: string, count: number) {
  return monthRange(addMonths(ym, 1), addMonths(ym, count)).map((m) => ({
    ym: m,
    total: sum(
      data.transactions
        .filter(
          (t) =>
            t.reference_month === monthStart(m) &&
            t.kind === "expense" &&
            t.installments_total > 1,
        )
        .map((t) => t.amount),
    ),
  }));
}

export type InvestmentSummary = {
  id: string;
  invested: number;
  current: number;
  gain: number;
  gainPct: number;
};

export function investmentSummaries(data: FinanceData) {
  const items: InvestmentSummary[] = data.investments.map((inv) => {
    const moves = data.movements.filter((m) => m.investment_id === inv.id);
    const invested = sum(moves.map((m) => (m.kind === "deposit" ? m.amount : -m.amount)));
    const gain = sum([inv.current_value, -invested]);
    return {
      id: inv.id,
      invested,
      current: inv.current_value,
      gain,
      gainPct: invested > 0 ? gain / invested : 0,
    };
  });
  const invested = sum(items.map((i) => i.invested));
  const current = sum(items.map((i) => i.current));
  const emergency = sum(
    data.investments.filter((i) => i.is_emergency || i.type === "reserva").map((i) => i.current_value),
  );
  return {
    items,
    invested,
    current,
    gain: sum([current, -invested]),
    gainPct: invested > 0 ? (current - invested) / invested : 0,
    emergency,
  };
}

/** Aportes líquidos (aportes - resgates) em um mês. */
export function netContributions(data: FinanceData, ym: string) {
  return sum(
    data.movements
      .filter((m) => toYm(m.date) === ym)
      .map((m) => (m.kind === "deposit" ? m.amount : -m.amount)),
  );
}
