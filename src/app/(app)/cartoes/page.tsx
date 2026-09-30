import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { deleteCard } from "@/app/actions/cards";
import { CardForm } from "@/components/card-form";
import { SimpleBars } from "@/components/charts";
import { ActionButton } from "@/components/confirm-button";
import { MonthNav } from "@/components/month-nav";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionTable } from "@/components/transaction-table";
import { Card, Empty, PageHeader, Progress, Stat } from "@/components/ui";
import { loadFinance } from "@/lib/data";
import { cardStatus, futureInstallments } from "@/lib/finance";
import { money, percent } from "@/lib/format";
import { monthLabel, parseMonth } from "@/lib/months";

export const metadata: Metadata = { title: "Cartões" };

export default async function CardsPage({ searchParams }: PageProps<"/cartoes">) {
  const ym = parseMonth((await searchParams).mes);
  const data = await loadFinance(ym, 0);
  const statuses = data.cards.map((c) => cardStatus(data, c, ym));
  const invoiceTotal = statuses.reduce((a, c) => a + c.invoiceTotal, 0);
  const limitTotal = data.cards.reduce((a, c) => a + c.credit_limit, 0);
  const outstanding = statuses.reduce((a, c) => a + c.outstanding, 0);
  const future = futureInstallments(data, ym, 12);
  const futureTotal = future.reduce((a, f) => a + f.total, 0);

  return (
    <>
      <PageHeader title="Cartões de crédito" subtitle="Compras no cartão entram na fatura certa automaticamente, com parcelas nos meses seguintes.">
        <MonthNav ym={ym} basePath="/cartoes" />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={`Faturas de ${monthLabel(ym, "short")}`} value={money(invoiceTotal)} />
        <Stat label="Limite total" value={money(limitTotal)} />
        <Stat
          label="Limite comprometido"
          value={money(outstanding)}
          hint={limitTotal > 0 ? `${percent(outstanding / limitTotal)} do limite` : undefined}
          tone={limitTotal > 0 && outstanding / limitTotal > 0.7 ? "negative" : "default"}
        />
        <Stat label="Parcelas futuras" value={money(futureTotal)} hint="Próximos 12 meses" />
      </div>

      {statuses.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statuses.map((st) => (
            <div key={st.card.id} className="rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div
                className="rounded-t-xl p-4 text-white"
                style={{ background: `linear-gradient(135deg, ${st.card.color}, ${st.card.color}cc)` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{st.card.name}</p>
                    <p className="text-xs opacity-80">{st.card.brand ?? "Cartão de crédito"}</p>
                  </div>
                  <ActionButton
                    action={deleteCard.bind(null, st.card.id)}
                    confirm={`Excluir o cartão ${st.card.name}? Todas as compras dele também serão excluídas.`}
                    title="Excluir cartão"
                    className="rounded-md p-1.5 text-white/70 hover:bg-white/20 hover:text-white"
                  >
                    <Trash2 className="size-4" />
                  </ActionButton>
                </div>
                <p className="mt-4 text-xs opacity-80">Fatura de {monthLabel(ym)}</p>
                <p className="text-2xl font-semibold tabular-nums">{money(st.invoiceTotal)}</p>
              </div>
              <div className="space-y-2 p-4 text-sm">
                <div className="flex justify-between text-zinc-500">
                  <span>Fecha dia {st.card.closing_day}</span>
                  <span>Vence dia {st.card.due_day}</span>
                </div>
                {st.card.credit_limit > 0 && (
                  <>
                    <Progress value={st.usage} />
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Usado {money(st.outstanding)}</span>
                      <span>Disponível {money(st.available)}</span>
                    </div>
                  </>
                )}
                <details className="pt-1">
                  <summary className="cursor-pointer text-xs font-medium text-emerald-700">Editar cartão</summary>
                  <div className="mt-3">
                    <CardForm card={st.card} />
                  </div>
                </details>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Nova compra no cartão" className="lg:col-span-2">
          {data.cards.length ? (
            <TransactionForm categories={data.categories} cards={data.cards} mode="card" />
          ) : (
            <Empty>Cadastre um cartão ao lado para registrar compras.</Empty>
          )}
        </Card>
        <Card title="Novo cartão">
          <CardForm />
        </Card>
      </div>

      {statuses.map((st) => (
        <Card
          key={st.card.id}
          title={`Fatura ${st.card.name} · ${monthLabel(ym)}`}
          action={<span className="text-sm font-semibold tabular-nums">{money(st.invoiceTotal)}</span>}
          className="mt-6"
        >
          <TransactionTable
            rows={st.invoice}
            categories={data.categories}
            showMethod={false}
            emptyText="Nenhuma compra nesta fatura."
          />
        </Card>
      ))}

      {futureTotal > 0 && (
        <Card title="Parcelas já comprometidas nos próximos meses" className="mt-6">
          <SimpleBars data={future.map((f) => ({ label: monthLabel(f.ym, "short"), value: f.total }))} />
        </Card>
      )}
    </>
  );
}
