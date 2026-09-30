import { Wallet } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <Wallet className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Gastos</h1>
          <p className="text-sm text-zinc-500">Entenda para onde vai o seu dinheiro.</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
