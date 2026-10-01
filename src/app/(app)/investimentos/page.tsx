import type { Metadata } from "next";
import {
  addMovement,
  createInvestment,
  deleteInvestment,
  deleteMovement,
  setEmergency,
  updateInvestmentValue,
} from "@/app/actions/investments";
import { ActionForm } from "@/components/action-form";
import { SimpleBars, Strip } from "@/components/bars";
import { ActionButton } from "@/components/confirm-button";
import { Icon } from "@/components/icon";
import { CmykNum, Empty, Field, HighlightIndex, IndexRow, PageHeader, Sq, Tag, btnMuted, btnSecondary, inputCls } from "@/components/ui";
import { loadFinance } from "@/lib/data";
import { investmentSummaries, monthSeries, netContributions } from "@/lib/finance";
import { INVESTMENT_COLORS, INVESTMENT_TYPES, formatDate, money, moneyRound, percent } from "@/lib/format";
import { addMonths, currentMonth, monthLabel, monthRange, todayISO } from "@/lib/months";
import type { InvestmentType } from "@/lib/types";

export const metadata: Metadata = { title: "Investimentos" };

const fmtMonths = (m: number) => m.toFixed(1).replace(".", ",");

export default async function InvestmentsPage() {
  const ym = currentMonth();
  const data = await loadFinance(ym, 11);
  const inv = investmentSummaries(data);
  const byId = new Map(inv.items.map((i) => [i.id, i]));
  const invName = new Map(data.investments.map((i) => [i.id, i.name]));

  const recent = monthSeries(data, ym, 3).filter((m) => m.expenses > 0);
  const avgExpenses = recent.length ? recent.reduce((a, m) => a + m.expenses, 0) / recent.length : 0;
  const reserveMonths = avgExpenses > 0 ? inv.emergency / avgExpenses : 0;
  const lastUpdate = data.investments.map((i) => i.value_updated_at).sort().at(-1);
  const n = data.investments.length;

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
    label: monthLabel(m, "short").slice(0, 3),
    value: netContributions(data, m),
  }));

  return (
    <>
      <PageHeader
        title="Investimentos"
        subtitle="Acompanhe quanto você tem investido, seus aportes e o rendimento de cada aplicação."
        dateline={`Carteira · ${n} ${n === 1 ? "aplicação" : "aplicações"}`}
        aside={lastUpdate ? <span>Atualizado em {formatDate(lastUpdate)}</span> : undefined}
      />

      <section className="mb-20 flex flex-wrap items-end gap-x-[72px] gap-y-10">
        <div className="min-w-0 flex-[1_1_360px]">
          <span className="kicker mb-[22px] block">Patrimônio investido</span>
          <CmykNum value={moneyRound(inv.current)} className="text-[clamp(50px,8.6cqi,104px)] tracking-[-0.03em]" />
        </div>
        <HighlightIndex
          rows={[
            { label: "Total aportado", value: money(inv.invested), hint: "Aportes menos resgates" },
            {
              label: "Rendimento",
              value: `${inv.gain >= 0 ? "+" : "−"}${money(Math.abs(inv.gain))}`,
              hint: inv.invested > 0 ? `${percent(inv.gainPct)} sobre o aportado` : undefined,
              tone: inv.gain >= 0 ? "positive" : "negative",
            },
            {
              label: "Reserva de emergência",
              value: money(inv.emergency),
              hint: avgExpenses > 0 ? `Cobre ${fmtMonths(reserveMonths)} de 6 meses recomendados` : "Marque aplicações como reserva",
              tone: avgExpenses > 0 ? (reserveMonths >= 6 ? "positive" : reserveMonths < 3 ? "negative" : "default") : "default",
            },
          ]}
        />
      </section>

      <section className="mb-20 flex flex-wrap gap-x-[72px] gap-y-16">
        <div className="min-w-0 flex-[1_1_300px]">
          <h2 className="h2 mb-[22px]">Distribuição da carteira</h2>
          {allocation.length ? (
            <>
              <Strip items={allocation} />
              {allocation.map((a) => (
                <IndexRow key={a.name} color={a.color} label={a.name} value={percent(a.value / inv.current)} className="[&>span:last-child]:min-w-0" />
              ))}
            </>
          ) : (
            <Empty>Cadastre seu primeiro investimento.</Empty>
          )}
        </div>
        <div className="min-w-0 flex-[2_1_420px]">
          <h2 className="h2 mb-1.5">Aportes líquidos, 12 meses</h2>
          <p className="mb-6 text-[15px] text-neutral-700">Aportes menos resgates em cada mês.</p>
          <SimpleBars height={200} color="var(--color-accent)" maxBar={30} gap="clamp(4px,1.4cqi,16px)" data={contributions} />
        </div>
      </section>

      <section className="mb-20 flex flex-wrap gap-x-[72px] gap-y-16">
        <div className="min-w-0 flex-[2_1_440px]">
          <h2 className="h2 mb-2.5">Minhas aplicações</h2>
          {n ? (
            <ul>
              {data.investments.map((i) => {
                const summary = byId.get(i.id)!;
                const reserve = i.is_emergency || i.type === "reserva";
                return (
                  <li key={i.id} className="border-b border-rule py-4">
                    <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                      <span className="mt-2 flex-none">
                        <Sq color={INVESTMENT_COLORS[i.type]} />
                      </span>
                      <div className="min-w-0 flex-[1_1_200px]">
                        <span className="flex flex-wrap items-center gap-2 text-base">
                          {i.name}
                          {reserve && (
                            <Tag>
                              <Icon name="shield-check" size={12} />
                              Reserva
                            </Tag>
                          )}
                        </span>
                        <span className="block text-[13px] text-neutral-700">
                          {INVESTMENT_TYPES[i.type]}
                          {i.institution && ` · ${i.institution}`} · atualizado em {formatDate(i.value_updated_at)}
                        </span>
                      </div>
                      <div className="ml-auto flex items-start gap-1.5">
                        <div className="text-right">
                          <span className="tnum block text-[17px] font-semibold">{money(i.current_value)}</span>
                          <span className={`tnum block text-[13px] ${summary.gain >= 0 ? "text-accent-700" : "text-accent-2-700"}`}>
                            {summary.gain >= 0 ? "+" : "−"}
                            {money(Math.abs(summary.gain))} ({percent(summary.gainPct)})
                          </span>
                        </div>
                        {i.type !== "reserva" && (
                          <ActionButton
                            action={setEmergency.bind(null, i.id, !i.is_emergency)}
                            title={i.is_emergency ? "Desmarcar como reserva" : "Marcar como reserva"}
                            className={i.is_emergency ? "btn btn-ghost btn-icon text-accent-700" : btnMuted}
                          >
                            <Icon name={i.is_emergency ? "shield-slash" : "shield-check"} />
                          </ActionButton>
                        )}
                        <ActionButton action={deleteInvestment.bind(null, i.id)} confirm={`Excluir "${i.name}" e todas as movimentações?`} title="Excluir">
                          <Icon name="trash" />
                        </ActionButton>
                      </div>
                    </div>
                    <details className="group mt-2 ml-[25px]">
                      <summary className="inline-flex min-h-7 cursor-pointer items-center gap-1.5 text-sm text-accent-700 hover:text-accent-800">
                        <Icon name="caret-right" size={14} className="transition-transform group-open:rotate-90" />
                        Aporte, resgate ou atualizar saldo
                      </summary>
                      <div className="mt-3.5 mb-1 flex flex-wrap gap-x-8 gap-y-5">
                        <ActionForm action={addMovement.bind(null, i.id)} submitLabel="Registrar" compact className="flex flex-[2_1_280px] flex-col items-start gap-2.5">
                          <div className="grid w-full grid-cols-3 gap-2">
                            <select name="kind" className={inputCls} aria-label="Tipo de movimentação">
                              <option value="deposit">Aporte</option>
                              <option value="withdrawal">Resgate</option>
                            </select>
                            <input name="amount" required inputMode="decimal" placeholder="0,00" className={`${inputCls} tnum`} aria-label="Valor" />
                            <input name="date" type="date" defaultValue={todayISO()} className={inputCls} aria-label="Data" />
                          </div>
                        </ActionForm>
                        <ActionForm
                          action={updateInvestmentValue.bind(null, i.id)}
                          submitLabel="Atualizar saldo"
                          submitClassName={btnSecondary}
                          compact
                          className="flex flex-[1_1_180px] flex-col items-start gap-2.5"
                        >
                          <input
                            name="current_value"
                            required
                            inputMode="decimal"
                            defaultValue={i.current_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            className={`${inputCls} tnum`}
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
        </div>

        <div className="min-w-0 flex-[1_1_280px]">
          <h2 className="h2 mb-5">Novo investimento</h2>
          <ActionForm action={createInvestment} submitLabel="Cadastrar">
            <div className="flex flex-col gap-[18px]">
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
                  <input name="initial" inputMode="decimal" className={`${inputCls} tnum`} placeholder="0,00" />
                </Field>
                <Field label="Saldo atual">
                  <input name="current_value" inputMode="decimal" className={`${inputCls} tnum`} placeholder="Igual ao aporte" />
                </Field>
              </div>
              <Field label="Data do aporte">
                <input name="date" type="date" defaultValue={todayISO()} className={inputCls} />
              </Field>
              <label className="flex min-h-8 cursor-pointer items-center gap-2.5 text-[15px]">
                <input type="checkbox" name="is_emergency" className="size-[18px] accent-accent" />
                Faz parte da reserva de emergência
              </label>
            </div>
          </ActionForm>
        </div>
      </section>

      <section>
        <h2 className="h2 mb-3.5">Movimentações recentes</h2>
        {data.movements.length ? (
          <div className="border-t border-divider">
            {data.movements.slice(0, 20).map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-rule py-2">
                <span className="tnum flex-[0_0_96px] text-sm text-neutral-700">{formatDate(m.date)}</span>
                <span className="min-w-0 flex-[1_1_180px] text-[15px]">
                  {invName.get(m.investment_id)}
                  {m.notes && <span className="text-neutral-700"> · {m.notes}</span>}
                </span>
                <div className="ml-auto flex items-center gap-3.5">
                  <Tag tone={m.kind === "deposit" ? "accent" : "accent-2"}>{m.kind === "deposit" ? "Aporte" : "Resgate"}</Tag>
                  <span className="tnum min-w-[100px] text-right text-[15px]">{money(m.amount)}</span>
                  <ActionButton action={deleteMovement.bind(null, m.id)} confirm="Excluir esta movimentação?" title="Excluir">
                    <Icon name="trash" />
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>Nenhuma movimentação ainda.</Empty>
        )}
      </section>
    </>
  );
}
