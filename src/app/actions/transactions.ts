"use server";

import { dbError, done, fail, int, optional, text } from "@/lib/form";
import { parseAmount } from "@/lib/format";
import { addMonths, invoiceMonth, monthStart, toYm } from "@/lib/months";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, PaymentMethod } from "@/lib/types";

/** Divide o total em parcelas com centavos corretos (a diferença vai na 1ª). */
function splitInstallments(total: number, n: number) {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  return Array.from({ length: n }, (_, i) => (i === 0 ? cents - base * (n - 1) : base) / 100);
}

/** Compras avulsas, compras no cartão (parceladas ou não) e receitas extras. */
export async function createTransaction(_: ActionState, fd: FormData): Promise<ActionState> {
  const kind = text(fd, "kind") === "income" ? "income" : "expense";
  const description = text(fd, "description");
  const amount = parseAmount(fd.get("amount"));
  const date = text(fd, "date");
  const method = (text(fd, "payment_method") || "pix") as PaymentMethod;
  const cardId = optional(fd, "credit_card_id");
  const installments = Math.min(72, Math.max(1, int(fd, "installments") || 1));

  if (!description) return fail("Informe uma descrição.");
  if (!(amount > 0)) return fail("Informe um valor maior que zero.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Informe uma data válida.");

  const supabase = await createClient();
  const base = {
    kind,
    description,
    date,
    category_id: optional(fd, "category_id"),
    notes: optional(fd, "notes"),
  };

  if (kind === "expense" && method === "credit_card") {
    if (!cardId) return fail("Selecione o cartão.");
    const { data: card, error } = await supabase
      .from("credit_cards")
      .select("closing_day, due_day")
      .eq("id", cardId)
      .single();
    if (error || !card) return fail("Cartão não encontrado.");

    const first = invoiceMonth(date, card.closing_day, card.due_day);
    const groupId = crypto.randomUUID();
    const rows = splitInstallments(amount, installments).map((value, i) => ({
      ...base,
      amount: value,
      payment_method: "credit_card",
      credit_card_id: cardId,
      reference_month: monthStart(addMonths(first, i)),
      installment_number: i + 1,
      installments_total: installments,
      group_id: groupId,
    }));
    const insert = await supabase.from("transactions").insert(rows);
    return dbError(insert.error) ?? done("Compra registrada no cartão.");
  }

  const insert = await supabase.from("transactions").insert({
    ...base,
    amount,
    payment_method: kind === "income" ? "transfer" : method === "credit_card" ? "pix" : method,
    reference_month: monthStart(toYm(date)),
  });
  return dbError(insert.error) ?? done(kind === "income" ? "Receita registrada." : "Gasto registrado.");
}

/** Exclui um lançamento; com `wholeGroup` apaga todas as parcelas da compra. */
export async function deleteTransaction(id: string, wholeGroup: boolean) {
  const supabase = await createClient();
  if (wholeGroup) {
    const { data } = await supabase.from("transactions").select("group_id").eq("id", id).single();
    if (data) await supabase.from("transactions").delete().eq("group_id", data.group_id);
  } else {
    await supabase.from("transactions").delete().eq("id", id);
  }
  done();
}
