import { updateIncome } from "@/app/actions/settings";
import { ActionForm } from "./action-form";
import { inputCls } from "./ui";

/** Campo único para cadastrar/alterar a renda mensal fixa. */
export function IncomeForm({ value }: { value: number }) {
  return (
    <ActionForm action={updateIncome} submitLabel="Salvar renda" compact className="flex flex-wrap items-center gap-2.5">
      <div className="relative w-[190px]">
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-neutral-700">R$</span>
        <input
          name="monthly_income"
          required
          inputMode="decimal"
          placeholder="0,00"
          defaultValue={value > 0 ? value.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : ""}
          className={`${inputCls} tnum pl-[34px]!`}
          aria-label="Renda mensal fixa"
        />
      </div>
    </ActionForm>
  );
}
