import type { Metadata } from "next";
import Link from "next/link";
import { CompositionChart, IncomeExpenseChart } from "@/components/charts";
import { MonthNav } from "@/components/month-nav";
import { TransactionTable } from "@/components/transaction-table";
import { Card, Dot, PageHeader, Stat, btnPrimary, inputCls } from "@/components/ui";
import { loadFinance } from "@/lib/data";
import { monthSeries } from "@/lib/finance";
import { PAYMENT_METHODS, money, percent } from "@/lib/format";
import { addMonths, monthLabel, monthStart, parseMonth } from "@/lib/months";

export const metadata: Metadata = { title: "Histórico" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function HistoryPage({ searchParams }: PageProps<"/historico">) {
  const params = await searchParams;
  const ym = parseMonth(params.mes);
  const q = first(params.q).trim().toLowerCase();
  const cat = first(params.categoria);
  const method = first(params.forma);

  const data = await loadFinance(ym, 11);
  const series = monthSeries(data, ym, 12);
  const active = series.filter((m) => m.expenses > 0 || m.extraIncome > 0);
  const avgExpenses = active.length ? active.reduce((a, m) => a + m.expenses, 0) / active.length : 0;
  const totalSaved = series.reduce((a, m) => a + Math.max(0, m.balance), 0);
  const best = [...active].sort((a, b) => a.expenses - b.expenses)[0];
  const worst = [...active].sort((a, b) => b.expenses - a.expenses)[0];

  // Evolução das categorias nos últimos 6 meses
  const last6 = series.slice(-6);
  const catIds = [...new Set(last6.flatMap((m) => m.byCategory.map((c) => c.id)))];
  const catRows = catIds
    .map((id) => {
      const info = last6.flatMap((m) => m.byCategory).find((c) => c.id === id)!;
      const values = last6.map((m) => m.byCategory.find((c) => c.id === id)?.total ?? 0);
      return { ...info, values, sum: values.reduce((a, b) => a + b, 0) };
    })
    .sort((a, b) => b.sum - a.sum);
  const maxCell = Math.max(1, ...catRows.flatMap((r) => r.values));

  // Busca de lançamentos
  const end = monthStart(ym);
  const filtered = data.transactions
    .filter((t) => t.reference_month <= end)
    .filter((t) => !q || t.description.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q))
    .filter((t) => !cat || t.category_id === cat)
    .filter((t) => !method || t.payment_method === method)
    .slice(0, 200);
  const filteredTotal = filtered.filter((t) => t.kind === "expense").reduce((a, t) => a + t.amount, 0);

  return (
    <>
      <PageHeader title="Histórico" subtitle={`Últimos 12 meses até ${monthLabel(ym)}`}>
        <MonthNav ym={ym} basePath="/historico" />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Média de gastos/mês" value={money(avgExpenses)} />
        <Stat label="Total poupado" value={money(totalSaved)} tone="positive" hint="Soma dos saldos positivos" />
        <Stat label="Mês mais econômico" value={best ? monthLabel(best.ym, "short") : "—"} hint={best ? money(best.expenses) : undefined} />
        <Stat label="Mês mais caro" value={worst ? monthLabel(worst.ym, "short") : "—"} hint={worst ? money(worst.expenses) : undefined} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Receitas x despesas">
          <IncomeExpenseChart
            data={series.map((m) => ({ label: monthLabel(m.ym, "short"), receitas: m.income, despesas: m.expenses, saldo: m.balance }))}
          />
        </Card>
        <Card title="Composição das despesas">
          <CompositionChart
            data={series.map((m) => ({ label: monthLabel(m.ym, "short"), fixas: m.fixedTotal, cartao: m.cardTotal, outras: m.otherTotal }))}
          />
        </Card>
      </div>

      <Card title="Mês a mês" className="mt-6">
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-right text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-2 text-left font-medium">Mês</th>
                <th className="px-2 py-2 font-medium">Receitas</th>
                <th className="px-2 py-2 font-medium">Fixas</th>
                <th className="px-2 py-2 font-medium">Cartão</th>
                <th className="px-2 py-2 font-medium">Outras</th>
                <th className="px-2 py-2 font-medium">Despesas</th>
                <th className="px-2 py-2 font-medium">Saldo</th>
                <th className="px-5 py-2 font-medium">Poupança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 tabular-nums">
              {[...series].reverse().map((m) => (
                <tr key={m.ym} className="text-right hover:bg-zinc-50/60">
                  <td className="px-5 py-2.5 text-left">
                    <Link href={`/dashboard?mes=${m.ym}`} className="font-medium text-zinc-800 hover:text-emerald-700 hover:underline">
                      {monthLabel(m.ym)}
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 text-emerald-600">{money(m.income)}</td>
                  <td className="px-2 py-2.5">{money(m.fixedTotal)}</td>
                  <td className="px-2 py-2.5">{money(m.cardTotal)}</td>
                  <td className="px-2 py-2.5">{money(m.otherTotal)}</td>
                  <td className="px-2 py-2.5 font-medium">{money(m.expenses)}</td>
                  <td className={`px-2 py-2.5 font-medium ${m.balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>{money(m.balance)}</td>
                  <td className="px-5 py-2.5 text-zinc-500">{m.income > 0 ? percent(m.savingsRate) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {catRows.length > 0 && (
        <Card title="Evolução por categoria (6 meses)" className="mt-6">
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-right text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-2 text-left font-medium">Categoria</th>
                  {last6.map((m) => (
                    <th key={m.ym} className="px-2 py-2 font-medium">{monthLabel(m.ym, "short")}</th>
                  ))}
                  <th className="px-5 py-2 font-medium">Média</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {catRows.map((r) => (
                  <tr key={r.id} className="text-right">
                    <td className="px-5 py-1.5 text-left">
                      <span className="flex items-center gap-2 text-zinc-700"><Dot color={r.color} />{r.name}</span>
                    </td>
                    {r.values.map((v, i) => (
                      <td key={i} className="px-1 py-1">
                        <span
                          className="block rounded px-2 py-1 text-xs"
                          style={{ background: v > 0 ? `${r.color}${Math.round(20 + (v / maxCell) * 60).toString(16).padStart(2, "0")}` : "transparent" }}
                        >
                          {v > 0 ? money(v) : "—"}
                        </span>
                      </td>
                    ))}
                    <td className="px-5 py-1.5 text-xs font-medium">{money(r.sum / 6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card title="Buscar lançamentos" className="mt-6">
        <form className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px_200px_auto]">
          <input type="hidden" name="mes" value={ym} />
          <input name="q" defaultValue={q} placeholder="Descrição ou observação..." className={inputCls} />
          <select name="categoria" defaultValue={cat} className={inputCls}>
            <option value="">Todas as categorias</option>
            {data.categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select name="forma" defaultValue={method} className={inputCls}>
            <option value="">Todas as formas</option>
            {Object.entries(PAYMENT_METHODS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button className={btnPrimary}>Filtrar</button>
        </form>
        <p className="mb-3 text-sm text-zinc-500">
          {filtered.length} lançamento(s) entre {monthLabel(addMonths(ym, -11))} e {monthLabel(ym)} · gastos: <strong className="text-zinc-800">{money(filteredTotal)}</strong>
        </p>
        <TransactionTable rows={filtered} categories={data.categories} cards={data.cards} emptyText="Nenhum lançamento encontrado." />
      </Card>
    </>
  );
}
