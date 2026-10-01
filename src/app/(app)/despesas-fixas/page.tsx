import type { Metadata } from "next";
import { createFixedExpense } from "@/app/actions/fixed";
import { ActionForm } from "@/components/action-form";
import { FixedRow, ReactivateButton } from "@/components/fixed-expenses";
import { MonthNav } from "@/components/month-nav";
import { Empty, Field, PageHeader, Progress, SectionHead, Stat, StatGrid, inputCls } from "@/components/ui";
import { loadFinance } from "@/lib/data";
import { isFixedActiveIn, monthSummary } from "@/lib/finance";
import { money, percent } from "@/lib/format";
import { monthLabel, parseMonth, toYm } from "@/lib/months";

export const metadata: Metadata = { title: "Despesas fixas" };

export default async function FixedExpensesPage({ searchParams }: PageProps<"/despesas-fixas">) {
  const ym = parseMonth((await searchParams).mes);
  const data = await loadFinance(ym, 0);
  const s = monthSummary(data, ym);
  const catMap = new Map(data.categories.map((c) => [c.id, c]));
  const paid = s.fixedItems.filter((f) => f.paid);
  const paidTotal = paid.reduce((a, f) => a + f.amount, 0);
  const pending = s.fixedTotal - paidTotal;
  const pendingCount = s.fixedItems.length - paid.length;
  const ended = data.fixed.filter((fe) => fe.end_month && !isFixedActiveIn(fe, ym) && toYm(fe.end_month) < ym);
  const n = s.fixedItems.length;

  return (
    <>
      <PageHeader
        title="Despesas fixas"
        subtitle="Contas que se repetem todo mês: aluguel, condomínio, internet, academia, escola..."
        dateline={`Despesas fixas · ${n} ${n === 1 ? "conta" : "contas"}`}
        monthNav={<MonthNav ym={ym} basePath="/despesas-fixas" />}
      />

      <StatGrid>
        <Stat label="Total fixo do mês" value={money(s.fixedTotal)} hint={`${n} ${n === 1 ? "conta" : "contas"}`} />
        <Stat label="Já pago" value={money(paidTotal)} tone="positive" hint={`${paid.length} de ${n}`} />
        <Stat
          label="Falta pagar"
          value={money(pending)}
          tone={pending > 0 ? "negative" : "muted"}
          hint={pendingCount ? `${pendingCount} ${pendingCount === 1 ? "conta pendente" : "contas pendentes"}` : "Tudo pago"}
        />
        <Stat
          label="Peso na renda"
          value={s.income > 0 ? percent(s.fixedTotal / s.income) : "—"}
          hint="Ideal: até 50%"
          tone={s.income > 0 && s.fixedTotal / s.income > 0.5 ? "negative" : "default"}
        />
      </StatGrid>

      <section className="flex flex-wrap gap-x-[72px] gap-y-16">
        <div className="min-w-0 flex-[2_1_440px]">
          <SectionHead
            title={`Contas de ${monthLabel(ym)}`}
            aside={s.fixedTotal > 0 && <span className="text-sm whitespace-nowrap text-neutral-700">{percent(paidTotal / s.fixedTotal)} pago</span>}
          />
          {s.fixedTotal > 0 && (
            <div className="mb-2">
              <Progress value={paidTotal / s.fixedTotal} color="var(--color-accent)" />
            </div>
          )}
          {n ? (
            <ul>
              {s.fixedItems.map((item) => (
                <FixedRow key={item.expense.id} item={item} ym={ym} category={catMap.get(item.expense.category_id ?? "")} />
              ))}
            </ul>
          ) : (
            <Empty>Nenhuma despesa fixa para este mês. Cadastre ao lado.</Empty>
          )}
        </div>

        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-14">
          <div>
            <h2 className="h2 mb-5">Nova despesa fixa</h2>
            <ActionForm action={createFixedExpense} submitLabel="Cadastrar">
              <div className="flex flex-col gap-[18px]">
                <Field label="Descrição">
                  <input name="description" required maxLength={120} className={inputCls} placeholder="Ex.: Aluguel" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Valor">
                    <input name="amount" required inputMode="decimal" className={`${inputCls} tnum`} placeholder="0,00" />
                  </Field>
                  <Field label="Vencimento (dia)">
                    <input name="due_day" type="number" min={1} max={31} required defaultValue={10} className={inputCls} />
                  </Field>
                </div>
                <Field label="Categoria">
                  <select name="category_id" className={inputCls} defaultValue="">
                    <option value="">Sem categoria</option>
                    {data.categories
                      .filter((c) => c.kind === "expense")
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </Field>
                <Field label="A partir de">
                  <input name="start_month" type="month" required defaultValue={ym} className={inputCls} />
                </Field>
              </div>
            </ActionForm>
          </div>

          {ended.length > 0 && (
            <div>
              <h2 className="h2-sm mb-3">Encerradas</h2>
              {ended.map((fe) => (
                <div key={fe.id} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <span className="block text-[15px] text-neutral-800">
                      {fe.description} · {money(fe.amount)}
                    </span>
                    <span className="block text-[13px] text-neutral-700">até {monthLabel(toYm(fe.end_month!))}</span>
                  </div>
                  <ReactivateButton id={fe.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
