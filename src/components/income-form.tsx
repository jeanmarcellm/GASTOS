import { updateIncome } from "@/app/actions/settings";
import { ActionForm } from "./action-form";
import { inputCls } from "./ui";

/** Campo único para cadastrar/alterar a renda mensal fixa. */
export function IncomeForm({ value }: { value: number }) {
  return (
    <ActionForm action={updateIncome} submitLabel="Salvar renda" compact className="flex flex-wrap items-center gap-2">
      <div className="relative w-44">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">R$</span>
        <input
          name="monthly_income"
          required
          inputMode="decimal"
          placeholder="0,00"
          defaultValue={value > 0 ? value.toFixed(2).replace(".", ",") : ""}
          className={`${inputCls} pl-9`}
          aria-label="Renda mensal fixa"
        />
      </div>
    </ActionForm>
  );
}
