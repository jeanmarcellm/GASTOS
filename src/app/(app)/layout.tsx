import { redirect } from "next/navigation";
import { LogOut, Wallet } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Nav } from "@/components/nav";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name").maybeSingle();
  const name = profile?.full_name || user.email;

  const account = (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-800">{name}</p>
        <p className="truncate text-xs text-zinc-500">{user.email}</p>
      </div>
      <form action={signOut}>
        <button className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" title="Sair" aria-label="Sair">
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );

  const brand = (
    <div className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
        <Wallet className="size-4" />
      </span>
      <span className="font-semibold tracking-tight">Gastos</span>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between border-r border-zinc-200 bg-white p-4 lg:flex">
        <div className="flex flex-col gap-6">
          <div className="px-2">{brand}</div>
          <Nav />
        </div>
        {account}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            {brand}
            <form action={signOut}>
              <button className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100" aria-label="Sair">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
          <Nav mobile />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
