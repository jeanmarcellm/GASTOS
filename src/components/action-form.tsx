"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionState } from "@/lib/types";
import { btnPrimary } from "./ui";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
  compact?: boolean;
  onSuccess?: () => void;
};

/** Formulário ligado a uma server action, com estado de envio e mensagens. */
export function ActionForm({ action, children, submitLabel = "Salvar", className = "", compact, onSuccess }: Props) {
  const [state, formAction, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result?.ok) onSuccess?.();
    return result;
  }, null);

  return (
    <form action={formAction} className={className}>
      {children}
      <div className={`flex flex-wrap items-center gap-3 ${compact ? "" : "mt-4"}`}>
        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending ? "Salvando..." : submitLabel}
        </button>
        {state?.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
        {state?.ok && state.message && <p className="text-sm text-emerald-600">{state.message}</p>}
      </div>
    </form>
  );
}
