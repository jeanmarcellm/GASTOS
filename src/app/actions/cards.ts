"use server";

import { dbError, done, fail, int, optional, text } from "@/lib/form";
import { parseAmount } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

function readCard(fd: FormData) {
  return {
    name: text(fd, "name"),
    brand: optional(fd, "brand"),
    credit_limit: parseAmount(fd.get("credit_limit")) || 0,
    closing_day: int(fd, "closing_day"),
    due_day: int(fd, "due_day"),
    color: text(fd, "color") || "#6366f1",
  };
}

function validate(card: ReturnType<typeof readCard>) {
  if (!card.name) return "Informe o nome do cartão.";
  if (!(card.closing_day >= 1 && card.closing_day <= 31)) return "Dia de fechamento inválido.";
  if (!(card.due_day >= 1 && card.due_day <= 31)) return "Dia de vencimento inválido.";
  return null;
}

export async function createCard(_: ActionState, fd: FormData): Promise<ActionState> {
  const card = readCard(fd);
  const invalid = validate(card);
  if (invalid) return fail(invalid);
  const supabase = await createClient();
  const { error } = await supabase.from("credit_cards").insert(card);
  return dbError(error) ?? done("Cartão cadastrado.");
}

export async function updateCard(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const card = readCard(fd);
  const invalid = validate(card);
  if (invalid) return fail(invalid);
  const supabase = await createClient();
  const { error } = await supabase.from("credit_cards").update(card).eq("id", id);
  return dbError(error) ?? done("Cartão atualizado.");
}

export async function deleteCard(id: string) {
  const supabase = await createClient();
  await supabase.from("credit_cards").delete().eq("id", id);
  done();
}
