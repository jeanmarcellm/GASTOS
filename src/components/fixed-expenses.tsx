"use client";

import { useState } from "react";
import {
  deleteFixedExpense,
  endFixedExpense,
  markFixedPaid,
  reactivateFixedExpense,
  unmarkFixedPaid,
  updateFixedAmount,
} from "@/app/actions/fixed";
import type { FixedItem } from "@/lib/finance";
import { money } from "@/lib/format";
import type { Category } from "@/lib/types";
import { ActionForm } from "./action-form";
import { ActionButton } from "./confirm-button";
import { Icon } from "./icon";
import { Sq, btnMuted, btnSecondary, inputCls } from "./ui";

export function FixedRow({ item, ym, category }: { item: FixedItem; ym: string; category?: Category }) {
  const [editing, setEditing] = useState(false);
  const fe = item.expense;

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule py-3.5">
      <div className="flex min-w-0 flex-[1_1_220px] items-center gap-3.5">
        <span className="flex w-11 flex-none flex-col items-center leading-none">
          <span className="text-[10px] tracking-[0.08em] text-neutral-700 uppercase">dia</span>
          <span className="tnum text-2xl font-semibold">{fe.due_day}</span>
        </span>
        <div className="min-w-0">
          <span className="block text-base">{fe.description}</span>
          <span className="flex items-center gap-1.5 text-[13px] text-neutral-700">
            {category ? (
              <>
                <Sq color={category.color} size={8} />
                {category.name}
              </>
            ) : (
              "Sem categoria"
            )}
          </span>
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-3.5">
        {editing ? (
          <ActionForm
            action={updateFixedAmount.bind(null, fe.id)}
            className="flex items-center gap-2"
            compact
            submitLabel="OK"
            submitClassName={btnSecondary}
            onSuccess={() => setEditing(false)}
          >
            <input
              name="amount"
              defaultValue={fe.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              inputMode="decimal"
              className={`${inputCls} tnum w-28`}
              aria-label="Novo valor"
              autoFocus
            />
          </ActionForm>
        ) : (
          <span className="tnum text-[17px] font-semibold whitespace-nowrap">{money(item.amount)}</span>
        )}

        <span className={`tag min-w-[72px] ${item.paid ? "tag-accent" : "tag-accent-2"}`}>{item.paid ? "Pago" : "Pendente"}</span>

        <div className="flex items-center">
          {item.paid && item.paymentId ? (
            <ActionButton action={unmarkFixedPaid.bind(null, item.paymentId)} title="Desmarcar pagamento" className={btnMuted}>
              <Icon name="arrow-u-up-left" />
            </ActionButton>
          ) : (
            <ActionButton
              action={markFixedPaid.bind(null, fe.id, ym, fe.amount)}
              title="Marcar como pago"
              className="btn btn-ghost btn-icon text-accent-700"
            >
              <Icon name="check" />
            </ActionButton>
          )}
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={btnMuted}
            title="Alterar valor"
            aria-label="Alterar valor"
            aria-pressed={editing}
          >
            <Icon name="pencil-simple" />
          </button>
          <ActionButton
            action={endFixedExpense.bind(null, fe.id, ym)}
            confirm={`Encerrar "${fe.description}"? Ela continua no histórico, mas deixa de contar a partir do mês seguinte.`}
            title="Encerrar a partir do próximo mês"
            className={btnMuted}
          >
            <Icon name="power" />
          </ActionButton>
          <ActionButton action={deleteFixedExpense.bind(null, fe.id)} confirm={`Excluir "${fe.description}" e todo o histórico de pagamentos?`} title="Excluir">
            <Icon name="trash" />
          </ActionButton>
        </div>
      </div>
    </li>
  );
}

export function ReactivateButton({ id }: { id: string }) {
  return (
    <ActionButton action={reactivateFixedExpense.bind(null, id)} title="Reativar" className="btn btn-ghost btn-icon btn-icon-lg">
      <Icon name="arrow-counter-clockwise" />
    </ActionButton>
  );
}
