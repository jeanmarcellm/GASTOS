import { deleteCategory, updateCategory } from "@/app/actions/settings";
import type { Category } from "@/lib/types";
import { ActionForm } from "./action-form";
import { ActionButton } from "./confirm-button";
import { Icon } from "./icon";
import { btnSecondary, inputCls } from "./ui";

export function CategoryRow({ category }: { category: Category }) {
  const isExpense = category.kind === "expense";
  const h = "min-h-10! min-w-0";
  return (
    <li className="flex items-center gap-2 border-b border-rule py-2.5">
      <ActionForm
        action={updateCategory.bind(null, category.id)}
        submitLabel="Salvar"
        submitClassName={`${btnSecondary} ${h}`}
        compact
        className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
      >
        <input name="color" type="color" defaultValue={category.color} className={`${inputCls} ${h} w-11! flex-none`} aria-label="Cor" />
        <input name="name" defaultValue={category.name} required maxLength={60} className={`${inputCls} ${h} flex-[1_1_120px] w-auto!`} aria-label="Nome" />
        {isExpense && (
          <>
            <select name="nature" defaultValue={category.nature ?? "lifestyle"} className={`${inputCls} ${h} flex-[0_1_150px] w-auto!`} aria-label="Tipo">
              <option value="essential">Necessidade</option>
              <option value="lifestyle">Estilo de vida</option>
            </select>
            <input
              name="monthly_budget"
              inputMode="decimal"
              defaultValue={category.monthly_budget ? category.monthly_budget.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : ""}
              placeholder="Limite/mês"
              className={`${inputCls} ${h} tnum flex-[0_1_120px] w-auto!`}
              aria-label="Limite mensal"
            />
          </>
        )}
      </ActionForm>
      <ActionButton
        action={deleteCategory.bind(null, category.id)}
        confirm={`Excluir a categoria "${category.name}"? Os lançamentos dela ficarão sem categoria.`}
        title="Excluir"
      >
        <Icon name="trash" />
      </ActionButton>
    </li>
  );
}
