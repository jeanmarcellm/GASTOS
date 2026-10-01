"use client";

import { btnPrimary } from "@/components/ui";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const missingSchema = /schema cache|does not exist/i.test(error.message);

  return (
    <div className="max-w-[60ch]">
      <h1 className="page-title">{missingSchema ? "O banco de dados ainda não foi configurado" : "Algo deu errado"}</h1>
      <p className="mb-6 text-[17px] text-neutral-700 italic">
        {missingSchema
          ? "Rode o arquivo supabase/schema.sql no SQL Editor do Supabase e tente de novo."
          : "Não foi possível carregar seus dados. Tente novamente em instantes."}
      </p>
      <div className="rule-double mb-6" />
      {process.env.NODE_ENV === "development" && <p className="mb-6 text-[13px] text-neutral-700">{error.message}</p>}
      <button onClick={() => retry()} className={btnPrimary}>
        Tentar novamente
      </button>
    </div>
  );
}
