import { Trash2 } from "lucide-react";
import { deleteCategory, updateCategory } from "@/app/actions/settings";
import type { Category } from "@/lib/types";
import { ActionForm } from "./action-form";
import { ActionButton } from "./confirm-button";
import { inputCls } from "./ui";

export function CategoryRow({ category }: { category: Category }) {
  const isExpense = category.kind === "expense";
  return (
    <li className="flex items-center gap-2 py-2">
      <ActionForm
        action={updateCategory.bind(null, category.id)}
        submitLabel="Salvar"
        compact
        className="flex flex-1 flex-wrap items-center gap-2"
      >
        <input name="color" type="color" defaultValue={category.color} className="h-9 w-10 cursor-pointer rounded-lg border border-zinc-300" aria-label="Cor" />
        <input name="name" defaultValue={category.name} required maxLength={60} className={`${inputCls} w-40 flex-1`} aria-label="Nome" />
        {isExpense && (
          <>
            <select name="nature" defaultValue={category.nature ?? "lifestyle"} className={`${inputCls} w-36`} aria-label="Tipo">
              <option value="essential">Necessidade</option>
              <option value="lifestyle">Estilo de vida</option>
            </select>
            <input
              name="monthly_budget"
              inputMode="decimal"
              defaultValue={category.monthly_budget ? String(category.monthly_budget).replace(".", ",") : ""}
              placeholder="Limite/mês"
              className={`${inputCls} w-28`}
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
        <Trash2 className="size-4" />
      </ActionButton>
    </li>
  );
}
