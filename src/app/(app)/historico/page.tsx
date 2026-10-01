import type { Metadata } from "next";
import Link from "next/link";
import { Legend, PairBars, StackedBars } from "@/components/bars";
import { Icon } from "@/components/icon";
import { MonthNav } from "@/components/month-nav";
import { TransactionTable } from "@/components/transaction-table";
import { Field, PageHeader, Sq, Stat, StatGrid, btnPrimary, inputCls } from "@/components/ui";
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
  const short = (m: string) => monthLabel(m, "short");

  return (
    <>
      <PageHeader
        title="Histórico"
        subtitle={`Últimos 12 meses até ${monthLabel(ym)}`}
        dateline={`${short(addMonths(ym, -11))} a ${short(ym)}`}
        monthNav={<MonthNav ym={ym} basePath="/historico" />}
      />

      <StatGrid>
        <Stat label="Média de gastos/mês" value={money(avgExpenses)} hint={`${active.length} ${active.length === 1 ? "mês" : "meses"}`} />
        <Stat label="Total poupado" value={money(totalSaved)} tone="positive" hint="Soma dos saldos positivos" />
        <Stat label="Mês mais econômico" value={best ? short(best.ym) : "—"} hint={best ? money(best.expenses) : undefined} />
        <Stat label="Mês mais caro" value={worst ? short(worst.ym) : "—"} hint={worst ? money(worst.expenses) : undefined} />
      </StatGrid>

      <section className="mb-20 grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] gap-x-[72px] gap-y-16">
        <div className="min-w-0">
          <div className="mb-[22px] flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
            <h2 className="h2">Receitas e despesas</h2>
            <Legend
              items={[
                { label: "Receitas", color: "var(--color-accent)" },
                { label: "Despesas", color: "var(--color-neutral-800)" },
              ]}
            />
          </div>
          <PairBars
            height={220}
            barWidth={14}
            gap="clamp(3px,1cqi,12px)"
            smallLabels
            data={series.map((m) => ({ label: short(m.ym).slice(0, 3), income: m.income, expense: m.expenses, balance: m.balance }))}
          />
        </div>
        <div className="min-w-0">
          <div className="mb-[22px] flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
            <h2 className="h2">Composição das despesas</h2>
            <Legend
              items={[
                { label: "Fixas", color: "var(--color-neutral-800)" },
                { label: "Cartão", color: "var(--color-accent)" },
                { label: "Outras", color: "var(--color-neutral-400)" },
              ]}
            />
          </div>
          <StackedBars
            height={220}
            data={series.map((m) => ({ label: short(m.ym).slice(0, 3), fixed: m.fixedTotal, card: m.cardTotal, other: m.otherTotal }))}
          />
        </div>
      </section>

      <section className="mb-20">
        <h2 className="h2 mb-3.5">Mês a mês</h2>
        <div className="-mx-2.5 overflow-x-auto">
          <table className="table tnum min-w-[760px]">
            <thead>
              <tr>
                <th>Mês</th>
                <th className="text-right">Receitas</th>
                <th className="text-right">Fixas</th>
                <th className="text-right">Cartão</th>
                <th className="text-right">Outras</th>
                <th className="text-right">Despesas</th>
                <th className="text-right">Saldo</th>
                <th className="text-right">Poupança</th>
              </tr>
            </thead>
            <tbody>
              {[...series].reverse().map((m) => (
                <tr key={m.ym}>
                  <td>
                    <Link href={`/dashboard?mes=${m.ym}`} className="text-text hover:text-accent-700 hover:underline">
                      {monthLabel(m.ym)}
                    </Link>
                  </td>
                  <td className="text-right text-accent-700">{money(m.income)}</td>
                  <td className="text-right">{money(m.fixedTotal)}</td>
                  <td className="text-right">{money(m.cardTotal)}</td>
                  <td className="text-right">{money(m.otherTotal)}</td>
                  <td className="text-right font-semibold">{money(m.expenses)}</td>
                  <td className={`text-right font-semibold ${m.balance >= 0 ? "text-accent-700" : "text-accent-2-700"}`}>{money(m.balance)}</td>
                  <td className="text-right text-neutral-700">{m.income > 0 ? percent(m.savingsRate) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {catRows.length > 0 && (
        <section className="mb-20">
          <h2 className="h2 mb-3.5">Evolução por categoria</h2>
          <div className="-mx-2.5 overflow-x-auto">
            <table className="table tnum min-w-[760px] text-[13px]">
              <thead>
                <tr>
                  <th>Categoria</th>
                  {last6.map((m) => (
                    <th key={m.ym} className="text-right">
                      {short(m.ym)}
                    </th>
                  ))}
                  <th className="text-right">Média</th>
                </tr>
              </thead>
              <tbody>
                {catRows.map((r) => (
                  <tr key={r.id}>
                    <td className="text-sm">
                      <span className="inline-flex items-center gap-2">
                        <Sq color={r.color} />
                        {r.name}
                      </span>
                    </td>
                    {r.values.map((v, i) => (
                      <td key={i} className="px-[3px]! py-1!">
                        <span
                          className="block px-2 py-1.5 text-right"
                          style={{
                            background: v > 0 ? `${r.color}${Math.round(20 + (v / maxCell) * 60).toString(16).padStart(2, "0")}` : "transparent",
                          }}
                        >
                          {v > 0 ? money(v) : "—"}
                        </span>
                      </td>
                    ))}
                    <td className="text-right font-semibold">{money(r.sum / 6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 className="h2 mb-5">Buscar lançamentos</h2>
        <form className="flex max-w-[960px] flex-wrap items-end gap-3">
          <input type="hidden" name="mes" value={ym} />
          <Field label="Descrição ou observação" className="flex-[2_1_260px]">
            <input name="q" defaultValue={q} className={inputCls} />
          </Field>
          <Field label="Categoria" className="flex-[1_1_170px]">
            <select name="categoria" defaultValue={cat} className={inputCls}>
              <option value="">Todas as categorias</option>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Forma" className="flex-[1_1_170px]">
            <select name="forma" defaultValue={method} className={inputCls}>
              <option value="">Todas as formas</option>
              {Object.entries(PAYMENT_METHODS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </Field>
          <button className={`${btnPrimary} flex-none`}>
            <Icon name="magnifying-glass" size={16} />
            Filtrar
          </button>
        </form>
        <p className="mt-5 mb-3 text-[15px] text-neutral-800">
          {filtered.length} {filtered.length === 1 ? "lançamento" : "lançamentos"} entre {monthLabel(addMonths(ym, -11))} e {monthLabel(ym)} · gastos:{" "}
          <strong className="tnum">{money(filteredTotal)}</strong>
        </p>
        <TransactionTable
          rows={filtered}
          categories={data.categories}
          cards={data.cards}
          variant="list"
          showCategory={false}
          emptyText="Nenhum lançamento encontrado."
        />
      </section>
    </>
  );
}
