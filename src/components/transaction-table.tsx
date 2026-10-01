import { deleteTransaction } from "@/app/actions/transactions";
import { PAYMENT_METHODS, formatDate, money } from "@/lib/format";
import type { Category, CreditCard, Transaction } from "@/lib/types";
import { ActionButton } from "./confirm-button";
import { Icon } from "./icon";
import { Empty, Sq } from "./ui";

type Props = {
  rows: Transaction[];
  categories: Category[];
  cards?: CreditCard[];
  emptyText?: string;
  /**
   * table: tabela no desktop, lista no mobile (Lançamentos).
   * list: linhas que quebram, em qualquer largura (faturas, receitas, busca).
   */
  variant?: "table" | "list";
  showMethod?: boolean;
  showCategory?: boolean;
  shortDate?: boolean;
};

export function TransactionTable({
  rows,
  categories,
  cards = [],
  emptyText = "Nenhum lançamento.",
  variant = "table",
  showMethod = true,
  showCategory = true,
  shortDate,
}: Props) {
  if (!rows.length) return <Empty>{emptyText}</Empty>;
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  const items = rows.map((t) => {
    const cat = t.category_id ? catMap.get(t.category_id) : undefined;
    const card = t.credit_card_id ? cardMap.get(t.credit_card_id) : undefined;
    const installment = t.installments_total > 1;
    const income = t.kind === "income";
    return {
      t,
      cat,
      installment,
      income,
      date: shortDate ? formatDate(t.date).slice(0, 5) : formatDate(t.date),
      method: card ? card.name : income ? "Receita" : PAYMENT_METHODS[t.payment_method],
      amount: `${income ? "+" : ""}${money(t.amount)}`,
      remove: (
        <ActionButton
          action={deleteTransaction.bind(null, t.id, installment)}
          confirm={installment ? `Excluir a compra "${t.description}" e todas as ${t.installments_total} parcelas?` : `Excluir "${t.description}"?`}
          title="Excluir"
        >
          <Icon name="trash" size={17} />
        </ActionButton>
      ),
      tag: installment ? (
        <span className="tag tag-accent-2 tnum">
          {t.installment_number}/{t.installments_total}
        </span>
      ) : null,
    };
  });

  const mobileList = (
    <div className={`border-t border-divider ${variant === "table" ? "sm:hidden" : "hidden"}`}>
      {items.map(({ t, cat, date, method, amount, income, remove, tag }) => (
        <div key={t.id} className="flex items-center gap-2 border-b border-rule py-2.5">
          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-[15px]">
              <span className="truncate">{t.description}</span>
              {tag}
            </span>
            <span className="flex flex-wrap items-center gap-1.5 text-[13px] text-neutral-700">
              {date.slice(0, 5)}
              {cat && (
                <>
                  {" · "}
                  <Sq color={cat.color} size={8} />
                  {cat.name}
                </>
              )}
              {showMethod && <> · {method}</>}
            </span>
          </div>
          <span className={`tnum text-[15px] whitespace-nowrap ${income ? "text-accent-700" : ""}`}>{amount}</span>
          <span className="[&_.btn]:size-11">{remove}</span>
        </div>
      ))}
    </div>
  );

  if (variant === "list") {
    return (
      <div className="border-t border-divider">
        {items.map(({ t, cat, date, method, amount, income, remove, tag }) => (
          <div key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-rule py-2.5">
            <span className="tnum flex-[0_0_96px] text-sm text-neutral-700">{date}</span>
            <div className="min-w-0 flex-[1_1_200px]">
              <span className="flex items-center gap-2.5 text-[15px]">
                {t.description}
                {tag}
              </span>
              {t.notes && <span className="block text-[13px] text-neutral-700">{t.notes}</span>}
            </div>
            {showCategory && (
              <span className="flex flex-[0_1_170px] items-center gap-2 text-sm text-neutral-800">
                {cat ? (
                  <>
                    <Sq color={cat.color} size={8} />
                    {cat.name}
                  </>
                ) : (
                  <span className="text-neutral-500">Sem categoria</span>
                )}
              </span>
            )}
            {showMethod && <span className="flex-[0_1_160px] text-sm text-neutral-800">{method}</span>}
            <div className="ml-auto flex items-center gap-1">
              <span className={`tnum min-w-[110px] text-right text-[15px] whitespace-nowrap ${income ? "text-accent-700" : ""}`}>{amount}</span>
              {remove}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <table className="table hidden sm:table">
        <thead>
          <tr>
            <th className="w-[120px]">Data</th>
            <th>Descrição</th>
            {showCategory && <th>Categoria</th>}
            {showMethod && <th>Pagamento</th>}
            <th className="text-right!">Valor</th>
            <th className="w-[52px]" />
          </tr>
        </thead>
        <tbody>
          {items.map(({ t, cat, date, method, amount, income, remove, tag }) => (
            <tr key={t.id}>
              <td className="tnum whitespace-nowrap text-neutral-700">{date}</td>
              <td>
                <span className="inline-flex items-center gap-2.5">
                  {t.description}
                  {tag}
                </span>
                {t.notes && <span className="block text-[13px] text-neutral-700">{t.notes}</span>}
              </td>
              {showCategory && (
                <td>
                  {cat ? (
                    <span className="inline-flex items-center gap-2">
                      <Sq color={cat.color} />
                      {cat.name}
                    </span>
                  ) : (
                    <span className="text-neutral-500">—</span>
                  )}
                </td>
              )}
              {showMethod && <td className="text-neutral-800">{method}</td>}
              <td className={`tnum text-right whitespace-nowrap ${income ? "text-accent-700" : ""}`}>{amount}</td>
              <td className="p-0.5! text-right">{remove}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {mobileList}
    </>
  );
}
