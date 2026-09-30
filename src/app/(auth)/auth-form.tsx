"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp } from "@/app/actions/auth";
import { Field, btnPrimary, inputCls } from "@/components/ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action, pending] = useActionState(mode === "login" ? signIn : signUp, null);

  if (mode === "signup" && state?.ok) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-zinc-700">{state.message}</p>
        <Link href="/login" className={btnPrimary}>Ir para o login</Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {mode === "signup" && (
        <Field label="Nome">
          <input name="full_name" required autoComplete="name" className={inputCls} />
        </Field>
      )}
      <Field label="E-mail">
        <input name="email" type="email" required autoComplete="email" className={inputCls} />
      </Field>
      <Field label="Senha">
        <input
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className={inputCls}
        />
      </Field>
      {mode === "signup" && (
        <Field label="Confirme a senha">
          <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={inputCls} />
        </Field>
      )}

      {state?.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}

      <button type="submit" className={btnPrimary} disabled={pending}>
        {pending ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
      </button>

      <p className="text-center text-sm text-zinc-500">
        {mode === "login" ? (
          <>Ainda não tem conta? <Link href="/cadastro" className="font-medium text-emerald-700 hover:underline">Cadastre-se</Link></>
        ) : (
          <>Já tem conta? <Link href="/login" className="font-medium text-emerald-700 hover:underline">Entrar</Link></>
        )}
      </p>
    </form>
  );
}
