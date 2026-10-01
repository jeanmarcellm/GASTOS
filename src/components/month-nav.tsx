import Link from "next/link";
import { addMonths, currentMonth, monthLabel } from "@/lib/months";
import { Icon } from "./icon";

const arrow = "btn btn-ghost btn-icon btn-icon-lg text-text hover:text-text";

/** Seletor de mês: fica dentro da linha de data, sem caixa. */
export function MonthNav({ ym, basePath }: { ym: string; basePath: string }) {
  const href = (m: string) => `${basePath}?mes=${m}`;
  return (
    <div className="-mr-2.5 flex items-center gap-0.5">
      <Link href={href(addMonths(ym, -1))} className={arrow} aria-label="Mês anterior">
        <Icon name="caret-left" />
      </Link>
      <span className="min-w-[150px] text-center text-text">{monthLabel(ym)}</span>
      <Link href={href(addMonths(ym, 1))} className={arrow} aria-label="Próximo mês">
        <Icon name="caret-right" />
      </Link>
      {ym !== currentMonth() && (
        <Link href={basePath} className="flex min-h-11 items-center px-2.5">
          Hoje
        </Link>
      )}
    </div>
  );
}
