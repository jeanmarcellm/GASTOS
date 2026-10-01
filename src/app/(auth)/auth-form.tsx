"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp } from "@/app/actions/auth";
import { Field, btnPrimary, inputCls } from "@/components/ui";

const tall = `${inputCls} min-h-12!`;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action, pending] = useActionState(mode === "login" ? signIn : signUp, null);

  if (mode === "signup" && state?.ok) {
    return (
      <div className="flex flex-col gap-5">
        <h2 className="text-[28px]">Confirme seu e-mail</h2>
        <p className="text-[15px] text-neutral-800">{state.message}</p>
        <Link href="/login" className={`${btnPrimary} min-h-12 w-full text-[15px]`}>
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="mb-6 text-[28px]">{mode === "login" ? "Entrar" : "Criar conta"}</h2>
      <form action={action} className="flex flex-col gap-[18px]">
        {mode === "signup" && (
          <Field label="Nome">
            <input name="full_name" required autoComplete="name" className={tall} />
          </Field>
        )}
        <Field label="E-mail">
          <input name="email" type="email" required autoComplete="email" className={tall} />
        </Field>
        <Field label="Senha">
          <input
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={tall}
          />
        </Field>
        {mode === "signup" && (
          <Field label="Confirme a senha">
            <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={tall} />
          </Field>
        )}

        {state?.error && <p className="text-sm text-accent-2-700" role="alert">{state.error}</p>}

        <button type="submit" className={`${btnPrimary} mt-2.5 min-h-12 w-full text-[15px]`} disabled={pending}>
          {pending ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>

        <p className="mt-1 text-[15px] text-neutral-800">
          {mode === "login" ? (
            <>
              Ainda não tem conta? <Link href="/cadastro" className="font-semibold underline">Cadastre-se</Link>
            </>
          ) : (
            <>
              Já tem conta? <Link href="/login" className="font-semibold underline">Entrar</Link>
            </>
          )}
        </p>
      </form>
    </>
  );
}
