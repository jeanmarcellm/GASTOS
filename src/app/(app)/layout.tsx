import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Icon } from "@/components/icon";
import { Nav } from "@/components/nav";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name").maybeSingle();
  const name = profile?.full_name || user.email;

  const signOutButton = (size: number, big?: boolean) => (
    <form action={signOut}>
      <button className={`btn btn-ghost btn-icon ${big ? "btn-icon-lg" : "size-9!"}`} title="Sair" aria-label="Sair">
        <Icon name="sign-out" size={size} />
      </button>
    </form>
  );

  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      <aside className="sticky top-0 hidden h-screen w-[252px] flex-none flex-col justify-between gap-10 pt-10 pr-5 pb-[30px] pl-[30px] lg:flex">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <Icon name="wallet" size={26} className="text-accent" />
              <span className="text-[28px] leading-none font-semibold tracking-[-0.02em]">Gastos</span>
            </div>
            <span className="text-sm leading-[1.35] text-neutral-700 italic">Entenda para onde vai o seu dinheiro.</span>
          </div>
          <Nav />
        </div>
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">{name}</span>
            <span className="truncate text-xs text-neutral-700">{user.email}</span>
          </div>
          {signOutButton(19)}
        </div>
      </aside>

      <header className="sticky top-0 z-10 w-full overflow-hidden bg-bg lg:hidden">
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
          <div className="flex items-center gap-2">
            <Icon name="wallet" size={22} className="text-accent" />
            <span className="text-[22px] leading-none font-semibold tracking-[-0.02em]">Gastos</span>
          </div>
          {signOutButton(20, true)}
        </div>
        <Nav mobile />
      </header>

      <main className="@container min-w-0 flex-1 px-[max(16px,4.5%)] pt-10 pb-[72px]">{children}</main>
    </div>
  );
}
