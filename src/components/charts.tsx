"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money } from "@/lib/format";

const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const axisProps = { tick: { fontSize: 12, fill: "#71717a" }, axisLine: false, tickLine: false } as const;
const tooltipFormatter = (value: unknown) => money(Number(value));

export type Slice = { name: string; value: number; color: string };

export function DonutChart({ data, height = 240 }: { data: Slice[]; height?: number }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke="none">
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip formatter={tooltipFormatter} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-zinc-500">Total</span>
        <span className="text-lg font-semibold tabular-nums text-zinc-900">{money(total)}</span>
      </div>
    </div>
  );
}

export type IncomeExpensePoint = { label: string; receitas: number; despesas: number; saldo: number };

export function IncomeExpenseChart({ data, height = 280 }: { data: IncomeExpensePoint[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f4f4f5" />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} tickFormatter={(v) => compact.format(v)} />
          <Tooltip formatter={tooltipFormatter} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="despesas" name="Despesas" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Line dataKey="saldo" name="Saldo" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export type CompositionPoint = { label: string; fixas: number; cartao: number; outras: number };

export function CompositionChart({ data, height = 280 }: { data: CompositionPoint[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f4f4f5" />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} tickFormatter={(v) => compact.format(v)} />
          <Tooltip formatter={tooltipFormatter} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="fixas" name="Fixas" stackId="a" fill="#6366f1" maxBarSize={36} />
          <Bar dataKey="cartao" name="Cartão" stackId="a" fill="#f59e0b" maxBarSize={36} />
          <Bar dataKey="outras" name="Outras" stackId="a" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleBars({
  data,
  color = "#f59e0b",
  height = 200,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f4f4f5" />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} tickFormatter={(v) => compact.format(v)} />
          <Tooltip formatter={tooltipFormatter} />
          <Bar dataKey="value" name="Valor" fill={color} radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
