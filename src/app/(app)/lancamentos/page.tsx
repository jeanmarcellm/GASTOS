import type { Metadata } from "next";
import { MonthNav } from "@/components/month-nav";
import { IncomeForm } from "@/components/income-form";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionTable } from "@/components/transaction-table";
import { Card, PageHeader, Stat } from "@/components/ui";
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

  return (
    <>
      <PageHeader title="Lançamentos" subtitle="Compras do dia a dia (Pix, débito, dinheiro, boleto) e receitas extras.">
        <MonthNav ym={ym} basePath="/lancamentos" />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Outros gastos" value={money(s.otherTotal)} hint={`${others.length} compras`} />
        <Stat label="Ticket médio" value={money(avgTicket)} />
        <Stat label="Receitas extras" value={money(s.extraIncome)} tone="positive" hint={`${s.incomeTx.length} entradas`} />
        <Stat label="Compras no cartão" value={money(s.cardTotal)} hint="Veja na aba Cartões" tone="muted" />
      </div>

      <Card title="Renda mensal fixa" className="mt-6">
        <p className="mb-3 text-sm text-zinc-500">
          Salário líquido ou outra renda que entra todo mês. Ela conta como receita em todos os meses, sem precisar lançar de novo.
          Rendas variáveis (freelas, bônus, vendas) entram abaixo como <strong>Receita extra</strong>.
        </p>
        <IncomeForm value={data.profile.monthly_income} />
      </Card>

      <Card title="Novo lançamento" className="mt-6">
        <TransactionForm categories={data.categories} cards={data.cards} />
      </Card>

      <Card title="Gastos do mês" className="mt-6">
        <TransactionTable rows={others} categories={data.categories} emptyText="Nenhum gasto avulso neste mês." />
      </Card>

      <Card title="Receitas extras do mês" className="mt-6">
        <TransactionTable rows={s.incomeTx} categories={data.categories} showMethod={false} emptyText="Nenhuma receita extra neste mês." />
      </Card>
    </>
  );
}
