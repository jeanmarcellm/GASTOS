"use server";

import { dbError, done, fail, optional, text } from "@/lib/form";
import { parseAmount } from "@/lib/format";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

export async function updateProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Sessão expirada. Entre novamente.");
  const income = parseAmount(fd.get("monthly_income"));
  if (!(income >= 0)) return fail("Informe uma renda válida.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: optional(fd, "full_name"), monthly_income: income });
  return dbError(error) ?? done("Perfil atualizado.");
}

function readCategory(fd: FormData) {
  const budget = parseAmount(fd.get("monthly_budget"));
  const nature = text(fd, "nature");
  return {
    name: text(fd, "name"),
    color: text(fd, "color") || "#64748b",
    nature: nature === "essential" || nature === "lifestyle" ? nature : null,
    monthly_budget: Number.isFinite(budget) && budget > 0 ? budget : null,
  };
}

export async function createCategory(_: ActionState, fd: FormData): Promise<ActionState> {
  const kind = text(fd, "kind") === "income" ? "income" : "expense";
  const category = readCategory(fd);
  if (!category.name) return fail("Informe o nome da categoria.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .insert({ ...category, kind, nature: kind === "income" ? null : category.nature ?? "lifestyle" });
  return dbError(error) ?? done("Categoria criada.");
}

export async function updateCategory(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const category = readCategory(fd);
  if (!category.name) return fail("Informe o nome da categoria.");
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update(category).eq("id", id);
  return dbError(error) ?? done("Categoria atualizada.");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", id);
  done();
}

/** Atualiza só a renda mensal fixa (usado no painel e em Lançamentos). */
export async function updateIncome(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Sessão expirada. Entre novamente.");
  const income = parseAmount(fd.get("monthly_income"));
  if (!(income >= 0)) return fail("Informe uma renda válida.");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert({ id: user.id, monthly_income: income });
  return dbError(error) ?? done("Renda atualizada.");
}
