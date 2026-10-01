import type { Metadata } from "next";
import Link from "next/link";
import { InsightList } from "@/components/insight-list";
import { MonthNav } from "@/components/month-nav";
import { CmykNum, Empty, PageHeader, Progress, Sq } from "@/components/ui";
import { loadFinance } from "@/lib/data";
import { monthSummary } from "@/lib/finance";
import { money, percent } from "@/lib/format";
import { generateInsights, healthScore } from "@/lib/insights";
import { monthLabel, parseMonth } from "@/lib/months";

export const metadata: Metadata = { title: "Insights" };

/** Valor futuro de aportes mensais constantes. */
const futureValue = (monthly: number, rate: number, months: number) =>
  monthly * ((Math.pow(1 + rate, months) - 1) / rate);

const MONTHLY_RATE = 0.008; // ~10% ao ano, conservador para renda fixa

const OK = "var(--color-accent)";
const WARN = "var(--color-accent-2-400)";
const BAD = "var(--color-accent-2-700)";

export default async function InsightsPage({ searchParams }: PageProps<"/insights">) {
  const ym = parseMonth((await searchParams).mes);
  const data = await loadFinance(ym);
  const s = monthSummary(data, ym);
  const insights = generateInsights(data, ym);
  const health = healthScore(data, ym);

  const saved = Math.max(0, s.balance);
  const rule = [
    { label: "Necessidades", hint: "moradia, mercado, contas, saúde, transporte", value: s.essential, target: 0.5, bar: "var(--color-neutral-800)" },
    { label: "Estilo de vida", hint: "restaurantes, lazer, compras, assinaturas", value: s.lifestyle, target: 0.3, bar: "var(--color-neutral-800)" },
    { label: "Poupança e investimentos", hint: "o que sobrou no mês", value: saved, target: 0.2, bar: OK },
  ];

  const budgets = s.byCategory.filter((c) => c.budget);
  const cuttable = s.byCategory.filter((c) => c.nature === "lifestyle" && c.total > 0).slice(0, 4);

  return (
    <>
      <PageHeader
        title="Insights"
        subtitle={`Análise de ${monthLabel(ym)} e sugestões para melhorar sua vida financeira`}
        dateline={`Insights · ${insights.length} ${insights.length === 1 ? "análise" : "análises"}`}
        monthNav={<MonthNav ym={ym} basePath="/insights" />}
      />

      <section className="mb-[88px] flex flex-wrap gap-x-[72px] gap-y-16">
        <div className="min-w-0 flex-[1_1_300px]">
          <span className="kicker mb-[22px] block">Saúde financeira</span>
          <div className="flex items-end gap-4">
            <CmykNum value={String(health.score)} className="text-[clamp(96px,13cqi,150px)] tracking-[-0.04em]" />
            <span className="pb-1.5 text-[17px] text-neutral-700">
              de 100 · <em className="text-text">{health.label}</em>
            </span>
          </div>
          <div className="mt-9 flex flex-col gap-4">
            {health.parts.map((p) => (
              <div key={p.label}>
                <div className="mb-1.5 flex justify-between gap-3 text-[15px]">
                  <span>{p.label}</span>
                  <span className="tnum text-neutral-700">
                    {Math.round(p.value * p.weight)}/{p.weight}
                  </span>
                </div>
                <Progress value={p.value} color={p.value >= 0.75 ? OK : p.value >= 0.4 ? WARN : BAD} />
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-[2_1_420px]">
          <h2 className="h2 mb-3">Regra 50/30/20</h2>
          {s.income > 0 ? (
            <>
              <p className="mb-7 max-w-[62ch] text-[15px] leading-[1.6] text-neutral-800">
                Uma referência simples: 50% da renda para necessidades, 30% para desejos e 20% para o futuro. Gastos sem categoria não entram nesta conta.
              </p>
              <div className="flex flex-col gap-[30px]">
                {rule.map((r) => {
                  const share = r.value / s.income;
                  const ok = r.target === 0.2 ? share >= r.target : share <= r.target;
                  return (
                    <div key={r.label}>
                      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <div>
                          <span className="text-lg font-semibold">{r.label}</span>
                          <span className="block text-[13px] text-neutral-700">{r.hint}</span>
                        </div>
                        <span className="tnum text-[15px]">
                          <span className={`text-[22px] font-semibold ${ok ? "text-accent-700" : "text-accent-2-700"}`}>{percent(share)}</span>
                          <span className="text-neutral-700">
                            {" "}
                            / meta {percent(r.target)} · {money(r.value)}
                          </span>
                        </span>
                      </div>
                      <div className="relative">
                        <Progress value={share} color={r.bar} height={6} />
                        <span className="absolute -top-[5px] h-4 w-0.5 bg-text" style={{ left: `${r.target * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <Empty>
              Informe sua renda mensal em <Link href="/configuracoes">Configurações</Link> para ver esta análise.
            </Empty>
          )}
        </div>
      </section>

      <section className="flex flex-wrap gap-x-[72px] gap-y-16">
        <div className="min-w-0 flex-[2_1_440px]">
          <h2 className="h2 mb-6">Análises e alertas</h2>
          <InsightList insights={insights} showLevel />
        </div>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-16">
          <div>
            <div className="mb-5 flex items-baseline justify-between gap-4">
              <h2 className="h2-sm">Orçamentos por categoria</h2>
              <Link href="/configuracoes" className="text-sm whitespace-nowrap">
                Definir limites
              </Link>
            </div>
            {budgets.length ? (
              <div className="flex flex-col gap-[18px]">
                {budgets.map((c) => {
                  const ratio = c.total / c.budget!;
                  return (
                    <div key={c.id}>
                      <div className="mb-1.5 flex justify-between gap-3 text-[15px]">
                        <span className="flex items-center gap-2">
                          <Sq color={c.color} />
                          {c.name}
                        </span>
                        <span className={`tnum text-[13px] ${ratio > 1 ? "text-accent-2-700" : "text-neutral-700"}`}>
                          {money(c.total)} / {money(c.budget!)}
                        </span>
                      </div>
                      <Progress value={ratio} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty>Defina limites mensais por categoria para acompanhar aqui.</Empty>
            )}
          </div>

          <div>
            <h2 className="h2-sm mb-5">Quanto você ganharia cortando 20%</h2>
            {cuttable.length ? (
              <div className="flex flex-col gap-5">
                {cuttable.map((c) => {
                  const monthly = c.total * 0.2;
                  return (
                    <div key={c.id}>
                      <span className="flex items-center gap-2 text-[17px] font-semibold">
                        <Sq color={c.color} />
                        {c.name}
                      </span>
                      <p className="mt-1 text-[15px] leading-[1.55] text-neutral-800">
                        Economia de <strong>{money(monthly)}</strong>/mês. Investindo, vira{" "}
                        <strong className="text-accent-700">{money(futureValue(monthly, MONTHLY_RATE, 60))}</strong> em 5 anos.
                      </p>
                    </div>
                  );
                })}
                <p className="text-[13px] text-neutral-700 italic">Simulação com rendimento de 0,8% ao mês.</p>
              </div>
            ) : (
              <Empty>Sem gastos de estilo de vida neste mês.</Empty>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
