import type { Metadata } from "next";
import Link from "next/link";
import { InsightList } from "@/components/insight-list";
import { MonthNav } from "@/components/month-nav";
import { Card, Dot, Empty, PageHeader, Progress } from "@/components/ui";
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

export default async function InsightsPage({ searchParams }: PageProps<"/insights">) {
  const ym = parseMonth((await searchParams).mes);
  const data = await loadFinance(ym);
  const s = monthSummary(data, ym);
  const insights = generateInsights(data, ym);
  const health = healthScore(data, ym);

  const saved = Math.max(0, s.balance);
  const rule = [
    { label: "Necessidades", hint: "moradia, mercado, contas, saúde, transporte", value: s.essential, target: 0.5, color: "#6366f1" },
    { label: "Estilo de vida", hint: "restaurantes, lazer, compras, assinaturas", value: s.lifestyle, target: 0.3, color: "#f59e0b" },
    { label: "Poupança e investimentos", hint: "o que sobrou no mês", value: saved, target: 0.2, color: "#10b981" },
  ];

  const budgets = s.byCategory.filter((c) => c.budget);
  const cuttable = s.byCategory.filter((c) => c.nature === "lifestyle" && c.total > 0).slice(0, 4);

  return (
    <>
      <PageHeader title="Insights" subtitle={`Análise de ${monthLabel(ym)} e sugestões para melhorar sua vida financeira`}>
        <MonthNav ym={ym} basePath="/insights" />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Saúde financeira">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-semibold tabular-nums">{health.score}</span>
            <span className="pb-1.5 text-sm text-zinc-500">/ 100 · {health.label}</span>
          </div>
          <ul className="mt-5 flex flex-col gap-3">
            {health.parts.map((p) => (
              <li key={p.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-zinc-600">{p.label}</span>
                  <span className="tabular-nums text-zinc-500">
                    {Math.round(p.value * p.weight)}/{p.weight}
                  </span>
                </div>
                <Progress value={p.value} color={p.value >= 0.75 ? "#10b981" : p.value >= 0.4 ? "#f59e0b" : "#dc2626"} />
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Regra 50/30/20" className="lg:col-span-2">
          {s.income > 0 ? (
            <>
              <p className="mb-4 text-sm text-zinc-500">
                Uma referência simples: 50% da renda para necessidades, 30% para desejos e 20% para o futuro. Gastos sem categoria não entram nesta conta.
              </p>
              <ul className="flex flex-col gap-4">
                {rule.map((r) => {
                  const share = r.value / s.income;
                  const ok = r.target === 0.2 ? share >= r.target : share <= r.target;
                  return (
                    <li key={r.label}>
                      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                        <span>
                          <span className="font-medium text-zinc-800">{r.label}</span>
                          <span className="ml-2 text-xs text-zinc-400">{r.hint}</span>
                        </span>
                        <span className="tabular-nums">
                          <span className={ok ? "text-emerald-600" : "text-red-600"}>{percent(share)}</span>
                          <span className="text-zinc-400"> / meta {percent(r.target)} · {money(r.value)}</span>
                        </span>
                      </div>
                      <div className="relative">
                        <Progress value={share} color={r.color} />
                        <span className="absolute -top-0.5 h-3 w-0.5 bg-zinc-800" style={{ left: `${r.target * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <Empty>
              Informe sua renda mensal em <Link href="/configuracoes" className="text-emerald-700 underline">Configurações</Link> para ver esta análise.
            </Empty>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Análises e alertas" className="lg:col-span-2">
          <InsightList insights={insights} />
        </Card>

        <div className="flex flex-col gap-6">
          <Card
            title="Orçamentos por categoria"
            action={<Link href="/configuracoes" className="text-xs font-medium text-emerald-700 hover:underline">Definir limites</Link>}
          >
            {budgets.length ? (
              <ul className="flex flex-col gap-3">
                {budgets.map((c) => (
                  <li key={c.id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="flex items-center gap-2 text-zinc-700"><Dot color={c.color} />{c.name}</span>
                      <span className="tabular-nums text-zinc-500">{money(c.total)} / {money(c.budget!)}</span>
                    </div>
                    <Progress value={c.total / c.budget!} />
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Defina limites mensais por categoria para acompanhar aqui.</Empty>
            )}
          </Card>

          <Card title="Quanto você ganharia cortando 20%">
            {cuttable.length ? (
              <ul className="flex flex-col gap-3 text-sm">
                {cuttable.map((c) => {
                  const monthly = c.total * 0.2;
                  return (
                    <li key={c.id} className="rounded-lg bg-zinc-50 p-3">
                      <p className="flex items-center gap-2 font-medium text-zinc-800"><Dot color={c.color} />{c.name}</p>
                      <p className="mt-1 text-zinc-600">
                        Economia de <strong>{money(monthly)}</strong>/mês. Investindo, vira{" "}
                        <strong className="text-emerald-700">{money(futureValue(monthly, MONTHLY_RATE, 60))}</strong> em 5 anos.
                      </p>
                    </li>
                  );
                })}
                <li className="text-xs text-zinc-400">Simulação com rendimento de 0,8% ao mês.</li>
              </ul>
            ) : (
              <Empty>Sem gastos de estilo de vida neste mês.</Empty>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
