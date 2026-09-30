"use client";

import { btnPrimary } from "@/components/ui";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const missingSchema = /schema cache|does not exist/i.test(error.message);

  return (
    <div className="mx-auto mt-16 max-w-lg rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-zinc-900">
        {missingSchema ? "O banco de dados ainda não foi configurado" : "Algo deu errado"}
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        {missingSchema
          ? "Rode o arquivo supabase/schema.sql no SQL Editor do Supabase e tente de novo."
          : "Não foi possível carregar seus dados. Tente novamente em instantes."}
      </p>
      {process.env.NODE_ENV === "development" && (
        <p className="mt-3 rounded bg-zinc-50 p-2 font-mono text-xs text-zinc-500">{error.message}</p>
      )}
      <button onClick={() => retry()} className={`${btnPrimary} mt-5`}>
        Tentar novamente
      </button>
    </div>
  );
}
