import "server-only";
import { createClient } from "./supabase/server";
import { addMonths, monthStart } from "./months";
import type {
  Category,
  CreditCard,
  FixedExpense,
  FixedPayment,
  Investment,
  InvestmentMovement,
  Profile,
  Transaction,
} from "./types";

export type FinanceData = {
  profile: Profile;
  categories: Category[];
  cards: CreditCard[];
  fixed: FixedExpense[];
  payments: FixedPayment[];
  transactions: Transaction[];
  investments: Investment[];
  movements: InvestmentMovement[];
};

const num = <T extends object>(rows: T[] | null, keys: (keyof T)[]): T[] =>
  (rows ?? []).map((row) => {
    const copy = { ...row };
    for (const k of keys) if (copy[k] != null) (copy[k] as number) = Number(copy[k]);
    return copy;
  });

/**
 * Carrega tudo o que as telas precisam em paralelo. Os lançamentos vêm a partir
 * de `monthsBack` meses antes de `ym`, sem limite para frente (parcelas futuras).
 * O RLS garante que só venham dados do usuário logado.
 */
export async function loadFinance(ym: string, monthsBack = 11): Promise<FinanceData> {
  const supabase = await createClient();
  const from = monthStart(addMonths(ym, -monthsBack));

  const [profile, categories, cards, fixed, payments, transactions, investments, movements] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name, monthly_income").maybeSingle(),
      supabase.from("categories").select("*").order("name"),
      supabase.from("credit_cards").select("*").order("name"),
      supabase.from("fixed_expenses").select("*").order("due_day"),
      supabase.from("fixed_expense_payments").select("*").gte("month", from),
      supabase
        .from("transactions")
        .select("*")
        .gte("reference_month", from)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("investments").select("*").order("current_value", { ascending: false }),
      supabase.from("investment_movements").select("*").order("date", { ascending: false }),
    ]);

  const firstError = [profile, categories, cards, fixed, payments, transactions, investments, movements]
    .map((r) => r.error)
    .find(Boolean);
  if (firstError) throw new Error(`Erro ao carregar dados: ${firstError.message}`);

  return {
    profile: {
      id: profile.data?.id ?? "",
      full_name: profile.data?.full_name ?? null,
      monthly_income: Number(profile.data?.monthly_income ?? 0),
    },
    categories: num<Category>(categories.data, ["monthly_budget"]),
    cards: num<CreditCard>(cards.data, ["credit_limit"]),
    fixed: num<FixedExpense>(fixed.data, ["amount"]),
    payments: num<FixedPayment>(payments.data, ["amount"]),
    transactions: num<Transaction>(transactions.data, ["amount"]),
    investments: num<Investment>(investments.data, ["current_value"]),
    movements: num<InvestmentMovement>(movements.data, ["amount"]),
  };
}
