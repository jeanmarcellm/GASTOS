export type ActionState = { ok?: boolean; error?: string; message?: string } | null;

export type PaymentMethod =
  | "pix"
  | "debit"
  | "cash"
  | "credit_card"
  | "boleto"
  | "transfer"
  | "other";

export type InvestmentType =
  | "reserva"
  | "renda_fixa"
  | "tesouro"
  | "acoes"
  | "fii"
  | "fundos"
  | "cripto"
  | "previdencia"
  | "exterior"
  | "outros";

export type Profile = {
  id: string;
  full_name: string | null;
  monthly_income: number;
};

export type Category = {
  id: string;
  name: string;
  kind: "expense" | "income";
  nature: "essential" | "lifestyle" | null;
  color: string;
  monthly_budget: number | null;
};

export type CreditCard = {
  id: string;
  name: string;
  brand: string | null;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  color: string;
};

export type FixedExpense = {
  id: string;
  description: string;
  amount: number;
  category_id: string | null;
  due_day: number;
  active: boolean;
  start_month: string;
  end_month: string | null;
};

export type FixedPayment = {
  id: string;
  fixed_expense_id: string;
  month: string;
  amount: number;
  paid_at: string;
};

export type Transaction = {
  id: string;
  kind: "expense" | "income";
  description: string;
  amount: number;
  date: string;
  reference_month: string;
  category_id: string | null;
  payment_method: PaymentMethod;
  credit_card_id: string | null;
  installment_number: number;
  installments_total: number;
  group_id: string;
  notes: string | null;
};

export type Investment = {
  id: string;
  name: string;
  type: InvestmentType;
  institution: string | null;
  current_value: number;
  value_updated_at: string;
  is_emergency: boolean;
  notes: string | null;
};

export type InvestmentMovement = {
  id: string;
  investment_id: string;
  kind: "deposit" | "withdrawal";
  amount: number;
  date: string;
  notes: string | null;
};
