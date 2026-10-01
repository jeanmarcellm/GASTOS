import { money } from "@/lib/format";
import { Sq } from "./ui";

const plain = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const pctOf = (v: number, max: number) => `${max > 0 ? (Math.max(0, v) / max) * 100 : 0}%`;

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex gap-4 text-[13px] text-neutral-700">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <Sq color={i.color} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function Labels({ labels, gap, small, current }: { labels: string[]; gap: string; small?: boolean; current?: number }) {
  return (
    <div className="flex pt-2" style={{ gap }}>
      {labels.map((l, i) => (
        <span
          key={i}
          className={`min-w-0 flex-1 text-center ${small ? "text-[11px]" : "text-[13px]"} ${i === current ? "text-text" : "text-neutral-700"}`}
        >
          {l}
        </span>
      ))}
    </div>
  );
}

export type PairPoint = { label: string; income: number; expense: number; balance: number };

/**
 * Pares de barras receitas (ciano) x despesas (neutral-800).
 * Com `showBalance`, mostra o saldo acima de cada mês.
 */
export function PairBars({
  data,
  height,
  showBalance,
  barWidth = 26,
  gap = "clamp(8px,2.4cqi,28px)",
  smallLabels,
}: {
  data: PairPoint[];
  height: number;
  showBalance?: boolean;
  barWidth?: number;
  gap?: string;
  smallLabels?: boolean;
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense])) * 1.05;
  return (
    <div>
      <div className="flex items-end border-b border-text" style={{ height, gap }}>
        {data.map((d, i) => (
          <div
            key={i}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
            title={`${d.label}: receitas ${money(d.income)} · despesas ${money(d.expense)} · saldo ${money(d.balance)}`}
          >
            {showBalance && (
              <span className={`tnum text-xs ${d.balance < 0 ? "text-accent-2-700" : "text-neutral-700"}`}>
                {d.balance >= 0 ? "+" : "−"}
                {plain.format(Math.abs(Math.round(d.balance)))}
              </span>
            )}
            <div className={`flex w-full items-end justify-center ${showBalance ? "gap-[3px]" : "gap-0.5"}`} style={{ height: showBalance ? "82%" : "100%" }}>
              <div className="bg-accent" style={{ flex: `0 1 ${barWidth}px`, height: pctOf(d.income, max) }} />
              <div className="bg-neutral-800" style={{ flex: `0 1 ${barWidth}px`, height: pctOf(d.expense, max) }} />
            </div>
          </div>
        ))}
      </div>
      <Labels labels={data.map((d) => d.label)} gap={gap} small={smallLabels} current={showBalance ? data.length - 1 : undefined} />
    </div>
  );
}

export type StackPoint = { label: string; fixed: number; card: number; other: number };

/** Barras empilhadas da composição: fixas (base), cartão, outras (topo). */
export function StackedBars({ data, height, gap = "clamp(3px,1cqi,12px)" }: { data: StackPoint[]; height: number; gap?: string }) {
  const max = Math.max(1, ...data.map((d) => d.fixed + d.card + d.other)) * 1.05;
  return (
    <div>
      <div className="flex items-end border-b border-text" style={{ height, gap }}>
        {data.map((d, i) => (
          <div
            key={i}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
            title={`${d.label}: fixas ${money(d.fixed)} · cartão ${money(d.card)} · outras ${money(d.other)}`}
          >
            <div className="w-full max-w-[30px] bg-neutral-400" style={{ height: pctOf(d.other, max) }} />
            <div className="w-full max-w-[30px] border-t border-bg bg-accent" style={{ height: pctOf(d.card, max) }} />
            <div className="w-full max-w-[30px] border-t border-bg bg-neutral-800" style={{ height: pctOf(d.fixed, max) }} />
          </div>
        ))}
      </div>
      <Labels labels={data.map((d) => d.label)} gap={gap} small />
    </div>
  );
}

/** Barras simples (parcelas futuras, aportes). Com `showValues`, o valor fica acima. */
export function SimpleBars({
  data,
  height,
  color,
  maxBar = 34,
  showValues,
  gap = "clamp(4px,1.4cqi,18px)",
}: {
  data: { label: string; value: number }[];
  height: number;
  color: string;
  maxBar?: number;
  showValues?: boolean;
  gap?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value)) * (showValues ? 1.22 : 1.05);
  return (
    <div>
      <div className="flex items-end border-b border-text" style={{ height, gap }}>
        {data.map((d, i) => (
          <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5" title={`${d.label}: ${money(d.value)}`}>
            {showValues && <span className="tnum text-[11px] text-neutral-700">{d.value > 0 ? plain.format(Math.round(d.value)) : ""}</span>}
            <div className="w-full" style={{ maxWidth: maxBar, height: pctOf(d.value, max), background: color }} />
          </div>
        ))}
      </div>
      <Labels labels={data.map((d) => d.label)} gap={gap} small />
    </div>
  );
}

/** Faixa empilhada de 12px (substitui o gráfico de rosca). */
export function Strip({ items }: { items: { color: string; value: number; name: string }[] }) {
  return (
    <div className="mb-[22px] flex h-3 gap-0.5">
      {items.map((i) => (
        <span key={i.name} title={`${i.name}: ${money(i.value)}`} style={{ flex: i.value, background: i.color }} />
      ))}
    </div>
  );
}
