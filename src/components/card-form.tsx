import { createCard, updateCard } from "@/app/actions/cards";
import type { CreditCard } from "@/lib/types";
import { ActionForm } from "./action-form";
import { Field, inputCls } from "./ui";

export function CardForm({ card }: { card?: CreditCard }) {
  const action = card ? updateCard.bind(null, card.id) : createCard;
  return (
    <ActionForm action={action} submitLabel={card ? "Salvar" : "Cadastrar cartão"}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-[18px]">
        <Field label="Nome" className="col-span-2">
          <input name="name" required maxLength={60} defaultValue={card?.name} className={inputCls} placeholder="Ex.: Nubank" />
        </Field>
        <Field label="Bandeira">
          <input name="brand" maxLength={30} defaultValue={card?.brand ?? ""} className={inputCls} placeholder="Visa, Master..." />
        </Field>
        <Field label="Limite">
          <input
            name="credit_limit"
            inputMode="decimal"
            defaultValue={card ? card.credit_limit.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : ""}
            className={`${inputCls} tnum`}
            placeholder="0,00"
          />
        </Field>
        <Field label="Dia do fechamento">
          <input name="closing_day" type="number" min={1} max={31} required defaultValue={card?.closing_day ?? 1} className={inputCls} />
        </Field>
        <Field label="Dia do vencimento">
          <input name="due_day" type="number" min={1} max={31} required defaultValue={card?.due_day ?? 10} className={inputCls} />
        </Field>
        <Field label="Cor">
          <input name="color" type="color" defaultValue={card?.color ?? "#0088b0"} className={inputCls} />
        </Field>
      </div>
    </ActionForm>
  );
}
