"use client";

import { useState } from "react";
import { createTransaction } from "@/app/actions/transactions";
import { PAYMENT_METHODS, money, parseAmount } from "@/lib/format";
import { todayISO } from "@/lib/months";
import type { Category, CreditCard, PaymentMethod } from "@/lib/types";
import { ActionForm } from "./action-form";
import { Field, inputCls } from "./ui";

type Props = {
  title: string;
  categories: Category[];
  cards: CreditCard[];
  /** "card" trava o formulário em compra no cartão; "income" em receita. */
  mode?: "expense" | "income" | "card";
};

export function TransactionForm({ title, categories, cards, mode = "expense" }: Props) {
  const [kind, setKind] = useState<"expense" | "income">(mode === "income" ? "income" : "expense");
  const [method, setMethod] = useState<PaymentMethod>(mode === "card" ? "credit_card" : "pix");
  const [amount, setAmount] = useState("");
  const [installments, setInstallments] = useState(1);

  const isCard = kind === "expense" && method === "credit_card";
  const cats = categories.filter((c) => c.kind === kind);
  const perInstallment = parseAmount(amount) / installments;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h2 className="h2">{title}</h2>
        {mode === "expense" && (
          <div className="seg" role="group" aria-label="Tipo de lançamento">
            {(["expense", "income"] as const).map((k) => (
              <button key={k} type="button" className="seg-opt" aria-pressed={kind === k} onClick={() => setKind(k)}>
                {k === "expense" ? "Gasto" : "Receita extra"}
              </button>
            ))}
          </div>
        )}
      </div>

      <ActionForm
        action={createTransaction}
        onSuccess={() => {
          setAmount("");
          setInstallments(1);
        }}
        submitLabel={kind === "income" ? "Registrar receita" : "Registrar gasto"}
      >
        <input type="hidden" name="kind" value={kind} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))] gap-x-5 gap-y-[18px]">
          <Field label="Descrição" className="col-span-full">
            <input
              name="description"
              required
              maxLength={120}
              className={inputCls}
              placeholder={kind === "income" ? "Ex.: Freela site" : "Ex.: Mercado do mês"}
            />
          </Field>
          <Field label={isCard && mode === "card" ? "Valor total" : "Valor"}>
            <input
              name="amount"
              required
              inputMode="decimal"
              className={`${inputCls} tnum`}
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Data">
            <input name="date" type="date" required defaultValue={todayISO()} className={inputCls} />
          </Field>
          <Field label="Categoria">
            <select name="category_id" className={inputCls} defaultValue="">
              <option value="">Sem categoria</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          {kind === "expense" && mode !== "card" && (
            <Field label="Forma de pagamento">
              <select
                name="payment_method"
                className={inputCls}
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              >
                {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                  <option key={value} value={value} disabled={value === "credit_card" && cards.length === 0}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {mode === "card" && <input type="hidden" name="payment_method" value="credit_card" />}

          {isCard && (
            <>
              <Field label="Cartão">
                <select name="credit_card_id" required className={inputCls}>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Parcelas">
                <select
                  name="installments"
                  className={inputCls}
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n === 1 ? "À vista" : `${n}x${perInstallment > 0 ? ` de ${money(perInstallment)}` : ""}`}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}

          <Field label="Observações (opcional)" className="col-span-full">
            <input name="notes" maxLength={300} className={inputCls} />
          </Field>
        </div>
      </ActionForm>
    </>
  );
}
