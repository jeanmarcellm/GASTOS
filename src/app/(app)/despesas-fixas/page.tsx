import type { Metadata } from "next";
import { createFixedExpense } from "@/app/actions/fixed";
import { ActionForm } from "@/components/action-form";
import { FixedRow, ReactivateButton } from "@/components/fixed-expenses";
import { MonthNav } from "@/components/month-nav";
import { Card, Empty, Field, PageHeader, Progress, Stat, inputCls } from "@/components/ui";
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
  const ended = data.fixed.filter((fe) => fe.end_month && !isFixedActiveIn(fe, ym) && toYm(fe.end_month) < ym);

  return (
    <>
      <PageHeader title="Despesas fixas" subtitle="Contas que se repetem todo mês: aluguel, condomínio, internet, academia, escola...">
        <MonthNav ym={ym} basePath="/despesas-fixas" />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total fixo do mês" value={money(s.fixedTotal)} hint={`${s.fixedItems.length} contas`} />
        <Stat label="Já pago" value={money(paidTotal)} tone="positive" hint={`${paid.length} de ${s.fixedItems.length}`} />
        <Stat label="Falta pagar" value={money(s.fixedTotal - paidTotal)} tone={s.fixedTotal - paidTotal > 0 ? "negative" : "muted"} />
        <Stat
          label="Peso na renda"
          value={s.income > 0 ? percent(s.fixedTotal / s.income) : "—"}
          hint="Ideal: até 50%"
          tone={s.income > 0 && s.fixedTotal / s.income > 0.5 ? "negative" : "default"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title={`Contas de ${monthLabel(ym)}`} className="lg:col-span-2">
          {s.fixedTotal > 0 && (
            <div className="mb-2">
              <Progress value={paidTotal / s.fixedTotal} color="#10b981" />
            </div>
          )}
          {s.fixedItems.length ? (
            <ul className="divide-y divide-zinc-100">
              {s.fixedItems.map((item) => (
                <FixedRow key={item.expense.id} item={item} ym={ym} category={catMap.get(item.expense.category_id ?? "")} />
              ))}
            </ul>
          ) : (
            <Empty>Nenhuma despesa fixa para este mês. Cadastre ao lado.</Empty>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card title="Nova despesa fixa">
            <ActionForm action={createFixedExpense} submitLabel="Cadastrar">
              <div className="flex flex-col gap-4">
                <Field label="Descrição">
                  <input name="description" required maxLength={120} className={inputCls} placeholder="Ex.: Aluguel" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Valor">
                    <input name="amount" required inputMode="decimal" className={inputCls} placeholder="0,00" />
                  </Field>
                  <Field label="Vencimento (dia)">
                    <input name="due_day" type="number" min={1} max={31} required defaultValue={10} className={inputCls} />
                  </Field>
                </div>
                <Field label="Categoria">
                  <select name="category_id" className={inputCls} defaultValue="">
                    <option value="">Sem categoria</option>
                    {data.categories.filter((c) => c.kind === "expense").map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="A partir de">
                  <input name="start_month" type="month" required defaultValue={ym} className={inputCls} />
                </Field>
              </div>
            </ActionForm>
          </Card>

          {ended.length > 0 && (
            <Card title="Encerradas">
              <ul className="divide-y divide-zinc-100">
                {ended.map((fe) => (
                  <li key={fe.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-zinc-500">
                      {fe.description} · {money(fe.amount)}
                      <span className="block text-xs text-zinc-400">até {monthLabel(toYm(fe.end_month!))}</span>
                    </span>
                    <ReactivateButton id={fe.id} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
