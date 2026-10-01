"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionState } from "@/lib/types";
import { btnPrimary } from "./ui";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel?: string;
  submitClassName?: string;
  className?: string;
  /** Botão na mesma linha dos campos (sem margem acima). */
  compact?: boolean;
  onSuccess?: () => void;
};

/** Formulário ligado a uma server action, com estado de envio e mensagens. */
export function ActionForm({
  action,
  children,
  submitLabel = "Salvar",
  submitClassName = btnPrimary,
  className = "",
  compact,
  onSuccess,
}: Props) {
  const [state, formAction, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result?.ok) onSuccess?.();
    return result;
  }, null);

  const message = (
    <>
      {state?.error && <p className="text-sm text-accent-2-700" role="alert">{state.error}</p>}
      {state?.ok && state.message && <p className="text-sm text-accent-700">{state.message}</p>}
    </>
  );

  if (compact) {
    return (
      <form action={formAction} className={className}>
        {children}
        <button type="submit" className={submitClassName} disabled={pending}>
          {pending ? "Salvando..." : submitLabel}
        </button>
        {message}
      </form>
    );
  }

  return (
    <form action={formAction} className={className}>
      {children}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" className={submitClassName} disabled={pending}>
          {pending ? "Salvando..." : submitLabel}
        </button>
        {message}
      </div>
    </form>
  );
}
