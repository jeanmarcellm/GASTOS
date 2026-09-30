"use server";

import { dbError, done, fail, int, optional, text } from "@/lib/form";
import { parseAmount } from "@/lib/format";
import { currentMonth, monthStart } from "@/lib/months";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

export async function createFixedExpense(_: ActionState, fd: FormData): Promise<ActionState> {
  const description = text(fd, "description");
  const amount = parseAmount(fd.get("amount"));
  const dueDay = int(fd, "due_day");
  const start = text(fd, "start_month") || currentMonth();

  if (!description) return fail("Informe uma descrição.");
  if (!(amount > 0)) return fail("Informe um valor maior que zero.");
  if (!(dueDay >= 1 && dueDay <= 31)) return fail("Dia de vencimento inválido.");

  const supabase = await createClient();
  const { error } = await supabase.from("fixed_expenses").insert({
    description,
    amount,
    due_day: dueDay,
    category_id: optional(fd, "category_id"),
    start_month: monthStart(start),
  });
  return dbError(error) ?? done("Despesa fixa cadastrada.");
}

export async function updateFixedAmount(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const amount = parseAmount(fd.get("amount"));
  if (!(amount > 0)) return fail("Informe um valor maior que zero.");
  const supabase = await createClient();
  const { error } = await supabase.from("fixed_expenses").update({ amount }).eq("id", id);
  return dbError(error) ?? done("Valor atualizado.");
}

/** Encerra a despesa: `ym` é o último mês em que ela ainda conta. */
export async function endFixedExpense(id: string, ym: string) {
  const supabase = await createClient();
  await supabase
    .from("fixed_expenses")
    .update({ active: false, end_month: monthStart(ym) })
    .eq("id", id);
  done();
}

export async function reactivateFixedExpense(id: string) {
  const supabase = await createClient();
  await supabase.from("fixed_expenses").update({ active: true, end_month: null }).eq("id", id);
  done();
}

export async function deleteFixedExpense(id: string) {
  const supabase = await createClient();
  await supabase.from("fixed_expenses").delete().eq("id", id);
  done();
}

export async function markFixedPaid(id: string, ym: string, amount: number) {
  const supabase = await createClient();
  await supabase
    .from("fixed_expense_payments")
    .upsert({ fixed_expense_id: id, month: monthStart(ym), amount }, { onConflict: "fixed_expense_id,month" });
  done();
}

export async function unmarkFixedPaid(paymentId: string) {
  const supabase = await createClient();
  await supabase.from("fixed_expense_payments").delete().eq("id", paymentId);
  done();
}

