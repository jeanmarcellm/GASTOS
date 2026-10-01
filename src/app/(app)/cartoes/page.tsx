import type { Metadata } from "next";
import { deleteCard } from "@/app/actions/cards";
import { SimpleBars } from "@/components/bars";
import { CardForm } from "@/components/card-form";
import { ActionButton } from "@/components/confirm-button";
import { Icon } from "@/components/icon";
import { MonthNav } from "@/components/month-nav";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionTable } from "@/components/transaction-table";
import { Empty, PageHeader, Progress, SectionHead, Sq, Stat, StatGrid } from "@/components/ui";
import { loadFinance } from "@/lib/data";
import { cardStatus, futureInstallments } from "@/lib/finance";
import { money, percent } from "@/lib/format";
import { monthLabel, parseMonth } from "@/lib/months";

export const metadata: Metadata = { title: "Cartões" };

const joinNames = (names: string[]) =>
  names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;

export default async function CardsPage({ searchParams }: PageProps<"/cartoes">) {
  const ym = parseMonth((await searchParams).mes);
  const data = await loadFinance(ym, 0);
  const statuses = data.cards.map((c) => cardStatus(data, c, ym));
  const invoiceTotal = statuses.reduce((a, c) => a + c.invoiceTotal, 0);
  const limitTotal = data.cards.reduce((a, c) => a + c.credit_limit, 0);
  const outstanding = statuses.reduce((a, c) => a + c.outstanding, 0);
  const future = futureInstallments(data, ym, 12);
  const futureTotal = future.reduce((a, f) => a + f.total, 0);
  const n = data.cards.length;

  return (
    <>
      <PageHeader
        title="Cartões de crédito"
        subtitle="Compras no cartão entram na fatura certa automaticamente, com parcelas nos meses seguintes."
        dateline={`Cartões · ${n} ${n === 1 ? "cadastrado" : "cadastrados"}`}
        monthNav={<MonthNav ym={ym} basePath="/cartoes" />}
      />

      <StatGrid className="mb-16">
        <Stat label={`Faturas de ${monthLabel(ym, "short")}`} value={money(invoiceTotal)} hint={`${n} ${n === 1 ? "cartão" : "cartões"}`} />
        <Stat label="Limite total" value={money(limitTotal)} hint={n ? joinNames(data.cards.map((c) => c.name)) : undefined} />
        <Stat
          label="Limite comprometido"
          value={money(outstanding)}
          hint={limitTotal > 0 ? `${percent(outstanding / limitTotal)} do limite` : undefined}
          tone={limitTotal > 0 && outstanding / limitTotal > 0.7 ? "negative" : "default"}
        />
        <Stat label="Parcelas futuras" value={money(futureTotal)} hint="Próximos 12 meses" />
      </StatGrid>

      {statuses.length > 0 && (
        <section className="mb-20 grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-6">
          {statuses.map((st) => (
            <article key={st.card.id} className="card">
              <div className="h-2" style={{ background: st.card.color }} />
              <div className="flex flex-col gap-4 px-[22px] pt-5 pb-[22px]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="card-kicker">{st.card.brand ?? "Cartão de crédito"}</span>
                    <span className="block text-2xl leading-[1.15] font-semibold">{st.card.name}</span>
                  </div>
                  <ActionButton
                    action={deleteCard.bind(null, st.card.id)}
                    confirm={`Excluir o cartão ${st.card.name}? Todas as compras dele também serão excluídas.`}
                    title="Excluir cartão"
                  >
                    <Icon name="trash" />
                  </ActionButton>
                </div>
                <div>
                  <span className="block text-[13px] text-neutral-700">Fatura de {monthLabel(ym)}</span>
                  <span className="tnum block text-4xl leading-[1.1] font-semibold tracking-[-0.02em]">{money(st.invoiceTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-neutral-800">
                  <span>Fecha dia {st.card.closing_day}</span>
                  <span>Vence dia {st.card.due_day}</span>
                </div>
                {st.card.credit_limit > 0 && (
                  <div>
                    <Progress value={st.usage} />
                    <div className="tnum mt-2 flex justify-between gap-2 text-[13px] text-neutral-700">
                      <span>Usado {money(st.outstanding)}</span>
                      <span>Disponível {money(st.available)}</span>
                    </div>
                  </div>
                )}
                <details className="group">
                  <summary className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 text-sm text-accent-700 hover:text-accent-800">
                    <Icon name="pencil-simple" size={15} />
                    Editar cartão
                  </summary>
                  <div className="mt-4">
                    <CardForm card={st.card} />
                  </div>
                </details>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="mb-20 flex flex-wrap gap-x-[72px] gap-y-14">
        <div className="min-w-0 flex-[2_1_420px]">
          {data.cards.length ? (
            <TransactionForm title="Nova compra no cartão" categories={data.categories} cards={data.cards} mode="card" />
          ) : (
            <>
              <h2 className="h2 mb-5">Nova compra no cartão</h2>
              <Empty>Cadastre um cartão ao lado para registrar compras.</Empty>
            </>
          )}
        </div>
        <div className="min-w-0 flex-[1_1_280px]">
          <h2 className="h2 mb-5">Novo cartão</h2>
          <CardForm />
        </div>
      </section>

      {statuses.map((st) => (
        <section key={st.card.id} className="mb-16">
          <SectionHead
            title={
              <span className="flex items-center gap-2.5">
                <Sq color={st.card.color} size={10} />
                Fatura {st.card.name}
              </span>
            }
            aside={<span className="tnum text-lg font-semibold whitespace-nowrap">{money(st.invoiceTotal)}</span>}
          />
          <TransactionTable
            rows={st.invoice}
            categories={data.categories}
            variant="list"
            showMethod={false}
            shortDate
            emptyText="Nenhuma compra nesta fatura."
          />
        </section>
      ))}

      {futureTotal > 0 && (
        <section>
          <h2 className="h2 mb-1.5">Parcelas já comprometidas</h2>
          <p className="mb-6 text-[15px] text-neutral-700">Próximos 12 meses · {money(futureTotal)} no total</p>
          <SimpleBars
            height={180}
            color="var(--color-neutral-800)"
            showValues
            data={future.map((f) => ({ label: monthLabel(f.ym, "short").slice(0, 3), value: f.total }))}
          />
        </section>
      )}
    </>
  );
}
