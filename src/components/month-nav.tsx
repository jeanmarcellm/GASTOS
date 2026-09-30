import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, currentMonth, monthLabel } from "@/lib/months";

export function MonthNav({ ym, basePath }: { ym: string; basePath: string }) {
  const href = (m: string) => `${basePath}?mes=${m}`;
  const arrow = "rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-100";
  return (
    <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
      <Link href={href(addMonths(ym, -1))} className={arrow} aria-label="Mês anterior">
        <ChevronLeft className="size-4" />
      </Link>
      <span className="min-w-40 text-center text-sm font-medium text-zinc-800">{monthLabel(ym)}</span>
      <Link href={href(addMonths(ym, 1))} className={arrow} aria-label="Próximo mês">
        <ChevronRight className="size-4" />
      </Link>
      {ym !== currentMonth() && (
        <Link href={basePath} className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
          Hoje
        </Link>
      )}
    </div>
  );
}
