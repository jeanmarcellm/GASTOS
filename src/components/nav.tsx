"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icon";

export const NAV_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Painel", icon: "squares-four" },
  { href: "/lancamentos", label: "Lançamentos", icon: "receipt" },
  { href: "/despesas-fixas", label: "Despesas fixas", icon: "calendar-check" },
  { href: "/cartoes", label: "Cartões", icon: "credit-card" },
  { href: "/historico", label: "Histórico", icon: "clock-counter-clockwise" },
  { href: "/investimentos", label: "Investimentos", icon: "piggy-bank" },
  { href: "/insights", label: "Insights", icon: "lightbulb" },
  { href: "/configuracoes", label: "Configurações", icon: "gear-six" },
];

export function Nav({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      className={
        mobile
          ? "scrollbar-none flex w-0 min-w-full gap-1 overflow-x-auto px-4 pb-3"
          : "-ml-2.5 flex flex-col gap-0.5"
      }
    >
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center rounded-md transition-colors hover:bg-accent/10 hover:text-accent-700 ${
              mobile ? "min-h-10 flex-none gap-[7px] px-3 text-sm whitespace-nowrap" : "gap-3 px-2.5 py-[9px] text-[15px]"
            } ${active ? "bg-accent-100 font-semibold text-accent-700" : "text-text"}`}
          >
            <Icon name={icon} size={mobile ? 17 : 19} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
