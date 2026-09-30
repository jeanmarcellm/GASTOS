import { Trash2 } from "lucide-react";
import { deleteTransaction } from "@/app/actions/transactions";
import { PAYMENT_METHODS, formatDate, money } from "@/lib/format";
import type { Category, CreditCard, Transaction } from "@/lib/types";
import { ActionButton } from "./confirm-button";
import { Dot, Empty } from "./ui";

type Props = {
  rows: Transaction[];
  categories: Category[];
  cards?: CreditCard[];
  emptyText?: string;
  showMethod?: boolean;
};

export function TransactionTable({ rows, categories, cards = [], emptyText = "Nenhum lançamento.", showMethod = true }: Props) {
  if (!rows.length) return <Empty>{emptyText}</Empty>;
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-500">
            <th className="px-5 py-2 font-medium">Data</th>
            <th className="px-2 py-2 font-medium">Descrição</th>
            <th className="px-2 py-2 font-medium">Categoria</th>
            {showMethod && <th className="px-2 py-2 font-medium">Pagamento</th>}
            <th className="px-2 py-2 text-right font-medium">Valor</th>
            <th className="w-12 px-5 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((t) => {
            const cat = t.category_id ? catMap.get(t.category_id) : undefined;
            const card = t.credit_card_id ? cardMap.get(t.credit_card_id) : undefined;
            const installment = t.installments_total > 1;
            return (
              <tr key={t.id} className="hover:bg-zinc-50/60">
                <td className="whitespace-nowrap px-5 py-2.5 text-zinc-500">{formatDate(t.date)}</td>
                <td className="px-2 py-2.5">
                  <span className="text-zinc-800">{t.description}</span>
                  {installment && (
                    <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">
                      {t.installment_number}/{t.installments_total}
                    </span>
                  )}
                  {t.notes && <p className="text-xs text-zinc-400">{t.notes}</p>}
                </td>
                <td className="px-2 py-2.5">
                  {cat ? (
                    <span className="flex items-center gap-2 text-zinc-600"><Dot color={cat.color} />{cat.name}</span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                {showMethod && (
                  <td className="px-2 py-2.5 text-zinc-600">
                    {card ? card.name : t.kind === "income" ? "Receita" : PAYMENT_METHODS[t.payment_method]}
                  </td>
                )}
                <td className={`whitespace-nowrap px-2 py-2.5 text-right font-medium tabular-nums ${t.kind === "income" ? "text-emerald-600" : ""}`}>
                  {t.kind === "income" ? "+" : ""}
                  {money(t.amount)}
                </td>
                <td className="px-5 py-2.5 text-right">
                  <ActionButton
                    action={deleteTransaction.bind(null, t.id, installment)}
                    confirm={installment ? `Excluir a compra "${t.description}" e todas as ${t.installments_total} parcelas?` : `Excluir "${t.description}"?`}
                    title="Excluir"
                  >
                    <Trash2 className="size-4" />
                  </ActionButton>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
