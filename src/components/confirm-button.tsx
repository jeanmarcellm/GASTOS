"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { btnDanger } from "./ui";

function Submit({ children, className, title }: { children: ReactNode; className: string; title?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} title={title} aria-label={title}>
      {children}
    </button>
  );
}

/** Botão que dispara uma server action, pedindo confirmação quando `confirm` é informado. */
export function ActionButton({
  action,
  children,
  confirm,
  title,
  className = btnDanger,
}: {
  action: () => Promise<void>;
  children: ReactNode;
  confirm?: string;
  title?: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className="inline-flex"
    >
      <Submit className={className} title={title}>
        {children}
      </Submit>
    </form>
  );
}
