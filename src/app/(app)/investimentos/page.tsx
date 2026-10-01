import type { Metadata } from "next";
import { ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import {
  addMovement,
  createInvestment,
  deleteInvestment,
  deleteMovement,
  setEmergency,
  updateInvestmentValue,
} from "@/app/actions/investments";
import { ActionForm } from "@/components/action-form";
import { DonutChart, SimpleBars } from "@/components/charts";
import { ActionButton } from "@/components/confirm-button";
import { Badge, Card, Dot, Empty, Field, PageHeader, Stat, inputCls } from "@/components/ui";
import { loadFinance } from "@/lib/data";
import { investmentSummaries, monthSeries, netContributions } from "@/lib/finance";
import { INVESTMENT_COLORS, INVESTMENT_TYPES, formatDate, money, percent } from "@/lib/format";
import { addMonths, currentMonth, monthLabel, monthRange, todayISO } from "@/lib/months";
import type { InvestmentType } from "@/lib/types";

export const metadata: Metadata = { title: "Investimentos" };

export default async function InvestmentsPage() {
  const ym = currentMonth();
  const data = await loadFinance(ym, 3);
  const inv = investmentSummaries(data);
  const byId = new Map(inv.items.map((i) => [i.id, i]));
  const invName = new Map(data.investments.map((i) => [i.id, i.name]));

  const recent = monthSeries(data, ym, 3).filter((m) => m.expenses > 0);
  const avgExpenses = recent.length ? recent.reduce((a, m) => a + m.expenses, 0) / recent.length : 0;
  const reserveMonths = avgExpenses > 0 ? inv.emergency / avgExpenses : 0;

  const allocation = Object.entries(
    data.investments.reduce<Record<string, number>>((acc, i) => {
      acc[i.type] = (acc[i.type] ?? 0) + i.current_value;
      return acc;
    }, {}),
  )
    .filter(([, v]) => v > 0)
    .map(([type, value]) => ({
      name: INVESTMENT_TYPES[type as InvestmentType],
      value,
      color: INVESTMENT_COLORS[type as InvestmentType],
    }))
    .sort((a, b) => b.value - a.value);

  const contributions = monthRange(addMonths(ym, -11), ym).map((m) => ({
    label: monthLabel(m, "short"),
    value: netContributions(data, m),
  }));

  return (
    <>
      <PageHeader title="Investimentos" subtitle="Acompanhe quanto você tem investido, seus aportes e o rendimento de cada aplicação." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Patrimônio investido" value={money(inv.current)} />
        <Stat label="Total aportado" value={money(inv.invested)} hint="Aportes menos resgates" />
        <Stat
          label="Rendimento"
          value={`${inv.gain >= 0 ? "+" : ""}${money(inv.gain)}`}
          tone={inv.gain >= 0 ? "positive" : "negative"}
          hint={inv.invested > 0 ? `${percent(inv.gainPct)} sobre o aportado` : undefined}
        />
        <Stat
          label="Reserva de emergência"
          value={money(inv.emergency)}
          hint={avgExpenses > 0 ? `Cobre ${reserveMonths.toFixed(1).replace(".", ",")} de 6 meses recomendados` : "Marque aplicações como reserva"}
          tone={reserveMonths >= 6 ? "positive" : reserveMonths < 3 ? "negative" : "default"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Distribuição da carteira">
          {allocation.length ? (
            <>
              <DonutChart data={allocation} height={220} />
              <ul className="mt-4 flex flex-col gap-2">
                {allocation.map((a) => (
                  <li key={a.name} className="flex items-center gap-2 text-sm">
                    <Dot color={a.color} />
                    <span className="flex-1 truncate text-zinc-700">{a.name}</span>
                    <span className="text-xs text-zinc-400">{percent(a.value / inv.current)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Empty>Cadastre seu primeiro investimento.</Empty>
          )}
        </Card>

        <Card title="Aportes líquidos nos últimos 12 meses" className="lg:col-span-2">
          <SimpleBars data={contributions} color="#10b981" height={260} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Minhas aplicações" className="lg:col-span-2">
          {data.investments.length ? (
            <ul className="divide-y divide-zinc-100">
              {data.investments.map((i) => {
                const summary = byId.get(i.id)!;
                return (
                  <li key={i.id} className="py-3">
                    <div className="flex flex-wrap items-start gap-3">
                      <Dot color={INVESTMENT_COLORS[i.type]} />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-800">
                          {i.name}
                          {(i.is_emergency || i.type === "reserva") && (
                            <Badge tone="sky"><ShieldCheck className="mr-1 size-3" />Reserva</Badge>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {INVESTMENT_TYPES[i.type]}
                          {i.institution && ` · ${i.institution}`} · atualizado em {formatDate(i.value_updated_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">{money(i.current_value)}</p>
                        <p className={`text-xs tabular-nums ${summary.gain >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {summary.gain >= 0 ? "+" : ""}
                          {money(summary.gain)} ({percent(summary.gainPct)})
                        </p>
                      </div>
                      {i.type !== "reserva" && (
                        <ActionButton
                          action={setEmergency.bind(null, i.id, !i.is_emergency)}
                          title={i.is_emergency ? "Desmarcar como reserva" : "Marcar como reserva"}
                          className={`rounded-md p-1.5 transition ${i.is_emergency ? "text-sky-600 hover:bg-zinc-100 hover:text-zinc-500" : "text-zinc-400 hover:bg-sky-50 hover:text-sky-600"}`}
                        >
                          {i.is_emergency ? <ShieldOff className="size-4" /> : <ShieldCheck className="size-4" />}
                        </ActionButton>
                      )}
                      <ActionButton
                        action={deleteInvestment.bind(null, i.id)}
                        confirm={`Excluir "${i.name}" e todas as movimentações?`}
                        title="Excluir"
                      >
                        <Trash2 className="size-4" />
                      </ActionButton>
                    </div>
                    <details className="mt-2 pl-5">
                      <summary className="cursor-pointer text-xs font-medium text-emerald-700">Aporte, resgate ou atualizar saldo</summary>
                      <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <ActionForm action={addMovement.bind(null, i.id)} submitLabel="Registrar" compact className="flex flex-col gap-2">
                          <div className="grid grid-cols-3 gap-2">
                            <select name="kind" className={inputCls}>
                              <option value="deposit">Aporte</option>
                              <option value="withdrawal">Resgate</option>
                            </select>
                            <input name="amount" required inputMode="decimal" placeholder="0,00" className={inputCls} />
                            <input name="date" type="date" defaultValue={todayISO()} className={inputCls} />
                          </div>
                        </ActionForm>
                        <ActionForm action={updateInvestmentValue.bind(null, i.id)} submitLabel="Atualizar saldo" compact className="flex flex-col gap-2">
                          <input
                            name="current_value"
                            required
                            inputMode="decimal"
                            defaultValue={String(i.current_value).replace(".", ",")}
                            className={inputCls}
                            aria-label="Saldo atual"
                          />
                        </ActionForm>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>Nenhum investimento cadastrado.</Empty>
          )}
        </Card>

        <Card title="Novo investimento">
          <ActionForm action={createInvestment} submitLabel="Cadastrar">
            <div className="flex flex-col gap-4">
              <Field label="Nome">
                <input name="name" required maxLength={80} className={inputCls} placeholder="Ex.: CDB 110% CDI" />
              </Field>
              <Field label="Tipo">
                <select name="type" className={inputCls} defaultValue="renda_fixa">
                  {Object.entries(INVESTMENT_TYPES).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="Instituição">
                <input name="institution" maxLength={60} className={inputCls} placeholder="Ex.: Nubank, XP, Inter" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Valor aportado">
                  <input name="initial" inputMode="decimal" className={inputCls} placeholder="0,00" />
                </Field>
                <Field label="Saldo atual">
                  <input name="current_value" inputMode="decimal" className={inputCls} placeholder="Igual ao aporte" />
                </Field>
              </div>
              <Field label="Data do aporte">
                <input name="date" type="date" defaultValue={todayISO()} className={inputCls} />
              </Field>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" name="is_emergency" className="size-4 accent-emerald-600" />
                Faz parte da reserva de emergência
              </label>
            </div>
          </ActionForm>
        </Card>
      </div>

      <Card title="Movimentações recentes" className="mt-6">
        {data.movements.length ? (
          <ul className="divide-y divide-zinc-100">
            {data.movements.slice(0, 20).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="w-24 shrink-0 text-zinc-500">{formatDate(m.date)}</span>
                <span className="flex-1 truncate text-zinc-800">
                  {invName.get(m.investment_id)}
                  {m.notes && <span className="text-zinc-400"> · {m.notes}</span>}
                </span>
                <Badge tone={m.kind === "deposit" ? "emerald" : "amber"}>{m.kind === "deposit" ? "Aporte" : "Resgate"}</Badge>
                <span className="w-28 text-right font-medium tabular-nums">{money(m.amount)}</span>
                <ActionButton action={deleteMovement.bind(null, m.id)} confirm="Excluir esta movimentação?" title="Excluir">
                  <Trash2 className="size-4" />
                </ActionButton>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Nenhuma movimentação ainda.</Empty>
        )}
      </Card>
    </>
  );
}
