import type { Metadata } from "next";
import { IncomeForm } from "@/components/income-form";
import { MonthNav } from "@/components/month-nav";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionTable } from "@/components/transaction-table";
import { PageHeader, SectionHead, Stat, StatGrid } from "@/components/ui";
import { loadFinance } from "@/lib/data";
import { monthSummary } from "@/lib/finance";
import { money } from "@/lib/format";
import { parseMonth } from "@/lib/months";

export const metadata: Metadata = { title: "Lançamentos" };

export default async function TransactionsPage({ searchParams }: PageProps<"/lancamentos">) {
  const ym = parseMonth((await searchParams).mes);
  const data = await loadFinance(ym, 0);
  const s = monthSummary(data, ym);
  const others = s.expenseTx.filter((t) => t.payment_method !== "credit_card");
  const avgTicket = others.length ? s.otherTotal / others.length : 0;
  const count = others.length + s.incomeTx.length;

  return (
    <>
      <PageHeader
        title="Lançamentos"
        subtitle="Compras do dia a dia (Pix, débito, dinheiro, boleto) e receitas extras."
        dateline={`Lançamentos · ${count} ${count === 1 ? "registro" : "registros"}`}
        monthNav={<MonthNav ym={ym} basePath="/lancamentos" />}
      />

      <StatGrid>
        <Stat label="Outros gastos" value={money(s.otherTotal)} hint={`${others.length} ${others.length === 1 ? "compra" : "compras"}`} />
        <Stat label="Ticket médio" value={money(avgTicket)} hint="por compra" />
        <Stat
          label="Receitas extras"
          value={money(s.extraIncome)}
          tone="positive"
          hint={`${s.incomeTx.length} ${s.incomeTx.length === 1 ? "entrada" : "entradas"}`}
        />
        <Stat label="Compras no cartão" value={money(s.cardTotal)} hint="Veja na aba Cartões" tone="muted" />
      </StatGrid>

      <section className="mb-20 flex flex-wrap gap-x-[72px] gap-y-14">
        <div className="min-w-0 flex-[1_1_280px]">
          <h2 className="h2 mb-3">Renda mensal fixa</h2>
          <p className="mb-5 max-w-[52ch] text-[15px] leading-[1.6] text-neutral-800">
            Salário líquido ou outra renda que entra todo mês. Ela conta como receita em todos os meses, sem precisar lançar de novo.
            Rendas variáveis (freelas, bônus, vendas) entram ao lado como <strong>Receita extra</strong>.
          </p>
          <IncomeForm value={data.profile.monthly_income} />
        </div>
        <div className="min-w-0 flex-[2_1_420px]">
          <TransactionForm title="Novo lançamento" categories={data.categories} cards={data.cards} />
        </div>
      </section>

      <section className="mb-[72px]">
        <SectionHead title="Gastos do mês" aside={<span className="tnum text-[15px] whitespace-nowrap">{money(s.otherTotal)}</span>} />
        <TransactionTable rows={others} categories={data.categories} emptyText="Nenhum gasto avulso neste mês." />
      </section>

      <section>
        <SectionHead
          title="Receitas extras do mês"
          aside={<span className="tnum text-[15px] whitespace-nowrap text-accent-700">+{money(s.extraIncome)}</span>}
        />
        <TransactionTable
          rows={s.incomeTx}
          categories={data.categories}
          variant="list"
          showMethod={false}
          emptyText="Nenhuma receita extra neste mês."
        />
      </section>
    </>
  );
}
