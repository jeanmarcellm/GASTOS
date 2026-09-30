import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DonutChart, IncomeExpenseChart } from "@/components/charts";
import { IncomeForm } from "@/components/income-form";
import { InsightList } from "@/components/insight-list";
import { MonthNav } from "@/components/month-nav";
import { Card, Dot, Empty, PageHeader, Progress, Stat } from "@/components/ui";
import { loadFinance } from "@/lib/data";
import { cardStatus, investmentSummaries, monthSeries, monthSummary } from "@/lib/finance";
import { PAYMENT_METHODS, formatDate, money, percent } from "@/lib/format";
import { generateInsights, healthScore } from "@/lib/insights";
import { monthLabel, parseMonth } from "@/lib/months";

export const metadata: Metadata = { title: "Painel" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const ym = parseMonth((await searchParams).mes);
  const data = await loadFinance(ym);
  const s = monthSummary(data, ym);
  const series = monthSeries(data, ym, 6);
  const insights = generateInsights(data, ym);
  const health = healthScore(data, ym);
  const inv = investmentSummaries(data);
  const cards = data.cards.map((c) => cardStatus(data, c, ym));
  const firstName = data.profile.full_name?.split(" ")[0];
  const unpaid = s.fixedItems.filter((f) => !f.paid);
  const catName = new Map(data.categories.map((c) => [c.id, c.name]));

  const composition = [
    { label: "Despesas fixas", value: s.fixedTotal, color: "#6366f1", href: "/despesas-fixas" },
    { label: "Cartões de crédito", value: s.cardTotal, color: "#f59e0b", href: "/cartoes" },
    { label: "Outros gastos", value: s.otherTotal, color: "#14b8a6", href: "/lancamentos" },
  ];

  return (
    <>
      <PageHeader title={firstName ? `Olá, ${firstName}` : "Painel"} subtitle={`Resumo de ${monthLabel(ym)}`}>
        <MonthNav ym={ym} basePath="/dashboard" />
      </PageHeader>

      {data.profile.monthly_income <= 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div>
            <p className="text-sm font-semibold text-emerald-900">Qual é a sua renda mensal fixa?</p>
            <p className="text-sm text-emerald-800">
              Informe o salário líquido que cai todo mês. Com ele calculamos saldo, taxa de poupança e os insights.
            </p>
          </div>
          <IncomeForm value={0} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Receitas" value={money(s.income)} hint={s.extraIncome > 0 ? `${money(s.extraIncome)} extras` : "Renda mensal"} />
        <Stat label="Despesas" value={money(s.expenses)} hint={`${s.expenseTx.length + s.fixedItems.length} lançamentos`} />
        <Stat label="Saldo do mês" value={money(s.balance)} tone={s.balance >= 0 ? "positive" : "negative"} />
        <Stat
          label="Taxa de poupança"
          value={s.income > 0 ? percent(s.savingsRate) : "—"}
          tone={s.savingsRate >= 0.2 ? "positive" : s.savingsRate < 0 ? "negative" : "default"}
          hint="Meta: 20% ou mais"
        />
        <Stat
          label="Investido"
          value={money(inv.current)}
          tone="default"
          hint={inv.invested > 0 ? `${inv.gain >= 0 ? "+" : ""}${money(inv.gain)} de rendimento` : "Nenhum investimento"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card title="Gastos por categoria" className="lg:col-span-2">
          {s.byCategory.length ? (
            <>
              <DonutChart data={s.byCategory.map((c) => ({ name: c.name, value: c.total, color: c.color }))} />
              <ul className="mt-4 flex flex-col gap-2">
                {s.byCategory.slice(0, 6).map((c) => (
                  <li key={c.id} className="flex items-center gap-2 text-sm">
                    <Dot color={c.color} />
                    <span className="flex-1 truncate text-zinc-700">{c.name}</span>
                    <span className="text-xs text-zinc-400">{percent(c.total / s.expenses)}</span>
                    <span className="w-24 text-right font-medium tabular-nums">{money(c.total)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Empty>Nenhum gasto registrado neste mês.</Empty>
          )}
        </Card>

        <Card title="Receitas x despesas nos últimos 6 meses" className="lg:col-span-3">
          <IncomeExpenseChart
            data={series.map((m) => ({
              label: monthLabel(m.ym, "short"),
              receitas: m.income,
              despesas: m.expenses,
              saldo: m.balance,
            }))}
          />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card
          title="Principais insights"
          className="lg:col-span-2"
          action={
            <Link href={`/insights?mes=${ym}`} className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline">
              Ver todos <ArrowRight className="size-3" />
            </Link>
          }
        >
          <InsightList insights={insights.slice(0, 4)} />
        </Card>

        <div className="flex flex-col gap-6">
          <Card title="Saúde financeira">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-semibold tabular-nums">{health.score}</span>
              <span className="pb-1 text-sm text-zinc-500">/ 100 · {health.label}</span>
            </div>
            <div className="mt-3">
              <Progress value={health.score / 100} color={health.score >= 60 ? "#10b981" : health.score >= 40 ? "#f59e0b" : "#dc2626"} />
            </div>
          </Card>

          <Card title="Para onde foi o dinheiro">
            <ul className="flex flex-col gap-3">
              {composition.map((c) => (
                <li key={c.label}>
                  <Link href={`${c.href}?mes=${ym}`} className="group block">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-zinc-600 group-hover:text-zinc-900">{c.label}</span>
                      <span className="font-medium tabular-nums">{money(c.value)}</span>
                    </div>
                    <Progress value={s.expenses > 0 ? c.value / s.expenses : 0} color={c.color} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Contas fixas a pagar">
          {unpaid.length ? (
            <ul className="divide-y divide-zinc-100">
              {unpaid.slice(0, 6).map((f) => (
                <li key={f.expense.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <span className="text-zinc-800">{f.expense.description}</span>
                    <span className="ml-2 text-xs text-zinc-400">dia {f.expense.due_day}</span>
                  </span>
                  <span className="font-medium tabular-nums">{money(f.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{s.fixedItems.length ? "Todas as contas fixas do mês estão pagas." : "Nenhuma despesa fixa cadastrada."}</Empty>
          )}
        </Card>

        <Card title="Faturas do mês">
          {cards.length ? (
            <ul className="flex flex-col gap-4">
              {cards.map((c) => (
                <li key={c.card.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Dot color={c.card.color} />
                      {c.card.name}
                      <span className="text-xs text-zinc-400">vence dia {c.card.due_day}</span>
                    </span>
                    <span className="font-medium tabular-nums">{money(c.invoiceTotal)}</span>
                  </div>
                  {c.card.credit_limit > 0 && <Progress value={c.usage} />}
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Nenhum cartão cadastrado.</Empty>
          )}
        </Card>

        <Card title="Últimos lançamentos">
          {s.expenseTx.length + s.incomeTx.length ? (
            <ul className="divide-y divide-zinc-100">
              {[...s.expenseTx, ...s.incomeTx]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 6)
                .map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-zinc-800">{t.description}</p>
                      <p className="text-xs text-zinc-400">
                        {formatDate(t.date)} · {catName.get(t.category_id ?? "") ?? PAYMENT_METHODS[t.payment_method]}
                      </p>
                    </div>
                    <span className={`shrink-0 font-medium tabular-nums ${t.kind === "income" ? "text-emerald-600" : ""}`}>
                      {t.kind === "income" ? "+" : ""}
                      {money(t.amount)}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <Empty>Nenhum lançamento neste mês.</Empty>
          )}
        </Card>
      </div>
    </>
  );
}
