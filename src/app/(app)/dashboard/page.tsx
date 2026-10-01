import type { Metadata } from "next";
import Link from "next/link";
import { PairBars, Legend, Strip } from "@/components/bars";
import { Icon } from "@/components/icon";
import { IncomeForm } from "@/components/income-form";
import { InsightList } from "@/components/insight-list";
import { MonthNav } from "@/components/month-nav";
import { CmykNum, Empty, HighlightIndex, IndexRow, PageHeader, Progress, Sq } from "@/components/ui";
import { loadFinance } from "@/lib/data";
import { cardStatus, investmentSummaries, monthSeries, monthSummary } from "@/lib/finance";
import { PAYMENT_METHODS, formatDate, money, percent } from "@/lib/format";
import { generateInsights, healthScore } from "@/lib/insights";
import { monthLabel, monthName, parseMonth } from "@/lib/months";

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

  const headline =
    s.balance < 0
      ? `Você gastou ${money(-s.balance)} a mais do que ganhou em ${monthName(ym)}.`
      : s.income > 0
        ? `Sobraram ${percent(s.savingsRate)} da sua renda em ${monthName(ym)}, ${s.savingsRate >= 0.2 ? "acima" : "abaixo"} da meta de 20%.`
        : "Cadastre sua renda mensal para ver quanto sobra todo mês.";

  const redMonths = series.filter((m) => m.balance < 0 && (m.income > 0 || m.expenses > 0)).map((m) => monthName(m.ym));
  const redNote = redMonths.length
    ? ` ${redMonths.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")} ${redMonths.length > 1 ? "fecharam" : "fechou"} no vermelho.`
    : "";

  const composition = [
    { label: "Despesas fixas", value: s.fixedTotal, href: "/despesas-fixas" },
    { label: "Cartões de crédito", value: s.cardTotal, href: "/cartoes" },
    { label: "Outros gastos", value: s.otherTotal, href: "/lancamentos" },
  ];

  const recent = [...s.expenseTx, ...s.incomeTx].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <>
      <PageHeader
        title={firstName ? `Olá, ${firstName}` : "Painel"}
        subtitle={`Resumo de ${monthLabel(ym)}`}
        dateline="Painel · Edição mensal"
        monthNav={<MonthNav ym={ym} basePath="/dashboard" />}
      />

      {data.profile.monthly_income <= 0 && (
        <section className="mb-[72px] max-w-[62ch]">
          <h2 className="h2 mb-3">Qual é a sua renda mensal fixa?</h2>
          <p className="mb-5 text-[15px] leading-[1.6] text-neutral-800">
            Informe o salário líquido que cai todo mês. Com ele calculamos saldo, taxa de poupança e os insights.
          </p>
          <IncomeForm value={0} />
        </section>
      )}

      <section className="mb-20 flex flex-wrap items-end gap-x-[72px] gap-y-10">
        <div className="min-w-0 flex-[1_1_380px]">
          <span className="kicker mb-[22px] block">Saldo do mês</span>
          <CmykNum value={money(s.balance)} className="text-[clamp(54px,9.5cqi,116px)] tracking-[-0.03em]" />
          <p className="mt-[26px] max-w-[34ch] text-[19px] leading-[1.45] italic">{headline}</p>
        </div>
        <HighlightIndex
          rows={[
            { label: "Receitas", value: money(s.income), hint: s.extraIncome > 0 ? `${money(s.extraIncome)} extras` : "Renda mensal" },
            { label: "Despesas", value: money(s.expenses), hint: `${s.expenseTx.length + s.fixedItems.length} lançamentos` },
            {
              label: "Taxa de poupança",
              value: s.income > 0 ? percent(s.savingsRate) : "—",
              hint: "Meta: 20% ou mais",
              tone: s.savingsRate >= 0.2 ? "positive" : s.savingsRate < 0 ? "negative" : "default",
            },
            {
              label: "Investido",
              value: money(inv.current),
              hint: inv.invested > 0 ? `${inv.gain >= 0 ? "+" : "−"}${money(Math.abs(inv.gain))} de rendimento` : "Nenhum investimento",
            },
          ]}
        />
      </section>

      <section className="mb-20 flex flex-wrap gap-x-[72px] gap-y-16">
        <div className="min-w-0 flex-[2_1_320px]">
          <h2 className="h2 mb-[22px]">Gastos por categoria</h2>
          {s.byCategory.length ? (
            <>
              <Strip items={s.byCategory.map((c) => ({ name: c.name, color: c.color, value: c.total }))} />
              {s.byCategory.slice(0, 6).map((c) => (
                <IndexRow key={c.id} color={c.color} label={c.name} pct={percent(c.total / s.expenses)} value={money(c.total)} />
              ))}
              {s.byCategory.length > 6 && (
                <Link href={`/historico?mes=${ym}`} className="mt-3 inline-flex items-center gap-1.5 text-sm">
                  Mais {s.byCategory.length - 6} categorias <Icon name="arrow-right" size={14} />
                </Link>
              )}
            </>
          ) : (
            <Empty>Nenhum gasto registrado neste mês.</Empty>
          )}
        </div>

        <div className="min-w-0 flex-[3_1_420px]">
          <div className="mb-[22px] flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="h2">Receitas e despesas, 6 meses</h2>
            <Legend
              items={[
                { label: "Receitas", color: "var(--color-accent)" },
                { label: "Despesas", color: "var(--color-neutral-800)" },
              ]}
            />
          </div>
          <PairBars
            height={250}
            showBalance
            data={series.map((m) => ({ label: monthLabel(m.ym, "short").slice(0, 3), income: m.income, expense: m.expenses, balance: m.balance }))}
          />
          <p className="mt-3.5 text-[13px] text-neutral-700">Acima de cada mês, o saldo.{redNote}</p>
        </div>
      </section>

      <section className="mb-20 flex flex-wrap gap-x-[72px] gap-y-16">
        <div className="min-w-0 flex-[2_1_420px]">
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2 className="h2">Principais insights</h2>
            <Link href={`/insights?mes=${ym}`} className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap">
              Ver todos <Icon name="arrow-right" size={14} />
            </Link>
          </div>
          <InsightList insights={insights.slice(0, 4)} />
        </div>

        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-14">
          <div>
            <h2 className="h2 mb-[18px]">Saúde financeira</h2>
            <div className="flex items-baseline gap-2.5">
              <span className="tnum text-[72px] leading-[0.9] font-semibold tracking-[-0.03em]">{health.score}</span>
              <span className="text-base text-neutral-700">
                de 100 · <em className="text-text">{health.label}</em>
              </span>
            </div>
            <div className="mt-[18px]">
              <Progress
                value={health.score / 100}
                color={health.score >= 60 ? "var(--color-accent)" : health.score >= 40 ? "var(--color-accent-2-400)" : "var(--color-accent-2-700)"}
              />
            </div>
          </div>

          <div>
            <h2 className="h2 mb-[18px]">Para onde foi o dinheiro</h2>
            <div className="flex flex-col gap-[18px]">
              {composition.map((c) => (
                <Link key={c.label} href={`${c.href}?mes=${ym}`} className="block text-text hover:text-accent-700">
                  <div className="mb-1.5 flex justify-between gap-3 text-[15px]">
                    <span>{c.label}</span>
                    <span className="tnum">{money(c.value)}</span>
                  </div>
                  <Progress value={s.expenses > 0 ? c.value / s.expenses : 0} color="var(--color-neutral-800)" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,270px),1fr))] gap-x-16 gap-y-14">
        <div className="min-w-0">
          <h2 className="h2-sm mb-4">Contas fixas a pagar</h2>
          {unpaid.length ? (
            unpaid.slice(0, 6).map((f) => (
              <div key={f.expense.id} className="flex items-baseline gap-2.5 text-[15px] leading-9">
                <span className="truncate">{f.expense.description}</span>
                <span className="text-[13px] whitespace-nowrap text-neutral-700">dia {f.expense.due_day}</span>
                <span className="leader mb-[0.75em] min-w-4" />
                <span className="tnum whitespace-nowrap">{money(f.amount)}</span>
              </div>
            ))
          ) : (
            <Empty>{s.fixedItems.length ? "Todas as contas fixas do mês estão pagas." : "Nenhuma despesa fixa cadastrada."}</Empty>
          )}
        </div>

        <div className="min-w-0">
          <h2 className="h2-sm mb-4">Faturas do mês</h2>
          {cards.length ? (
            <div className="flex flex-col gap-5">
              {cards.map((c) => (
                <div key={c.card.id}>
                  <div className="mb-2 flex items-baseline gap-2.5 text-[15px]">
                    <Sq color={c.card.color} />
                    <span className="truncate">{c.card.name}</span>
                    <span className="text-[13px] whitespace-nowrap text-neutral-700">vence dia {c.card.due_day}</span>
                    <span className="flex-1" />
                    <span className="tnum whitespace-nowrap">{money(c.invoiceTotal)}</span>
                  </div>
                  {c.card.credit_limit > 0 && (
                    <>
                      <Progress value={c.usage} />
                      <span className="mt-1.5 block text-[13px] text-neutral-700">
                        {percent(c.usage)} do limite de {money(c.card.credit_limit)}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty>Nenhum cartão cadastrado.</Empty>
          )}
        </div>

        <div className="min-w-0">
          <h2 className="h2-sm mb-4">Últimos lançamentos</h2>
          {recent.length ? (
            <div className="flex flex-col gap-3">
              {recent.map((t) => (
                <div key={t.id} className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block truncate text-[15px]">{t.description}</span>
                    <span className="block text-[13px] text-neutral-700">
                      {formatDate(t.date)} · {catName.get(t.category_id ?? "") ?? PAYMENT_METHODS[t.payment_method]}
                    </span>
                  </div>
                  <span className={`tnum text-[15px] whitespace-nowrap ${t.kind === "income" ? "text-accent-700" : ""}`}>
                    {t.kind === "income" ? "+" : ""}
                    {money(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Nenhum lançamento neste mês.</Empty>
          )}
        </div>
      </section>
    </>
  );
}
