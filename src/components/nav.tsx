"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  CreditCard,
  History,
  LayoutDashboard,
  Lightbulb,
  PiggyBank,
  Receipt,
  Settings,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/lancamentos", label: "Lançamentos", icon: Receipt },
  { href: "/despesas-fixas", label: "Despesas fixas", icon: CalendarClock },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/investimentos", label: "Investimentos", icon: PiggyBank },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Nav({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className={mobile ? "flex gap-1 overflow-x-auto px-4 pb-3" : "flex flex-col gap-1"}>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
