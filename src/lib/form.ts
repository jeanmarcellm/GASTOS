import { revalidatePath } from "next/cache";
import type { ActionState } from "./types";

export const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
export const optional = (fd: FormData, key: string) => text(fd, key) || null;
export const int = (fd: FormData, key: string) => Number.parseInt(text(fd, key), 10);

export const fail = (error: string): ActionState => ({ error });

export function done(message?: string): ActionState {
  revalidatePath("/", "layout");
  return { ok: true, message };
}

export function dbError(error: { message: string; code?: string } | null): ActionState | null {
  if (!error) return null;
  if (error.code === "23505") return fail("Já existe um registro com esse nome.");
  return fail(`Não foi possível salvar: ${error.message}`);
}
