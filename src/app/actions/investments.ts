"use server";

import { dbError, done, fail, optional, text } from "@/lib/form";
import { parseAmount } from "@/lib/format";
import { todayISO } from "@/lib/months";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

export async function createInvestment(_: ActionState, fd: FormData): Promise<ActionState> {
  const name = text(fd, "name");
  const initial = parseAmount(fd.get("initial")) || 0;
  const current = parseAmount(fd.get("current_value"));
  const date = text(fd, "date") || todayISO();
  if (!name) return fail("Informe o nome do investimento.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investments")
    .insert({
      name,
      type: text(fd, "type") || "renda_fixa",
      institution: optional(fd, "institution"),
      is_emergency: fd.get("is_emergency") === "on",
      current_value: Number.isFinite(current) && current >= 0 ? current : initial,
      notes: optional(fd, "notes"),
    })
    .select("id")
    .single();
  if (error) return dbError(error);

  if (initial > 0) {
    const move = await supabase
      .from("investment_movements")
      .insert({ investment_id: data.id, kind: "deposit", amount: initial, date, notes: "Aporte inicial" });
    if (move.error) return dbError(move.error);
  }
  return done("Investimento cadastrado.");
}

/**
 * Registra aporte ou resgate e ajusta o saldo atual na mesma proporção.
 */
export async function addMovement(investmentId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const kind = text(fd, "kind") === "withdrawal" ? "withdrawal" : "deposit";
  const amount = parseAmount(fd.get("amount"));
  if (!(amount > 0)) return fail("Informe um valor maior que zero.");

  const supabase = await createClient();
  const { data: inv, error } = await supabase
    .from("investments")
    .select("current_value")
    .eq("id", investmentId)
    .single();
  if (error || !inv) return fail("Investimento não encontrado.");

  const move = await supabase.from("investment_movements").insert({
    investment_id: investmentId,
    kind,
    amount,
    date: text(fd, "date") || todayISO(),
  });
  if (move.error) return dbError(move.error);

  const current = Number(inv.current_value) + (kind === "deposit" ? amount : -amount);
  await supabase
    .from("investments")
    .update({ current_value: Math.max(0, current), value_updated_at: todayISO() })
    .eq("id", investmentId);
  return done(kind === "deposit" ? "Aporte registrado." : "Resgate registrado.");
}

export async function updateInvestmentValue(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const value = parseAmount(fd.get("current_value"));
  if (!(value >= 0)) return fail("Informe um valor válido.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("investments")
    .update({ current_value: value, value_updated_at: todayISO() })
    .eq("id", id);
  return dbError(error) ?? done("Saldo atualizado.");
}

export async function deleteInvestment(id: string) {
  const supabase = await createClient();
  await supabase.from("investments").delete().eq("id", id);
  done();
}

export async function deleteMovement(id: string) {
  const supabase = await createClient();
  await supabase.from("investment_movements").delete().eq("id", id);
  done();
}

export async function setEmergency(id: string, value: boolean) {
  const supabase = await createClient();
  await supabase.from("investments").update({ is_emergency: value }).eq("id", id);
  done();
}
