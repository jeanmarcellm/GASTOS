"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { text } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.",
  user_already_exists: "Já existe uma conta com esse e-mail.",
  weak_password: "Senha muito fraca. Use pelo menos 8 caracteres.",
  over_email_send_rate_limit: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
};

const translate = (error: { code?: string; message: string }) =>
  (error.code && AUTH_ERRORS[error.code]) || error.message;

export async function signIn(_: ActionState, fd: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: text(fd, "email"),
    password: text(fd, "password"),
  });
  if (error) return { error: translate(error) };
  redirect("/dashboard");
}

export async function signUp(_: ActionState, fd: FormData): Promise<ActionState> {
  const password = text(fd, "password");
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  if (password !== text(fd, "confirm")) return { error: "As senhas não conferem." };

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: text(fd, "email"),
    password,
    options: {
      data: { full_name: text(fd, "full_name") },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });
  if (error) return { error: translate(error) };
  if (data.session) redirect("/dashboard");
  return {
    ok: true,
    message: "Conta criada! Enviamos um link de confirmação para o seu e-mail.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
