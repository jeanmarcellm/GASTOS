"use client";

import { useState } from "react";
import { Check, Pencil, Power, RotateCcw, Trash2, Undo2 } from "lucide-react";
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
import { Badge, Dot, inputCls } from "./ui";

export function FixedRow({ item, ym, category }: { item: FixedItem; ym: string; category?: Category }) {
  const [editing, setEditing] = useState(false);
  const fe = item.expense;

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-9 shrink-0 flex-col items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
          <span className="text-[10px] leading-none">dia</span>
          <span className="text-sm font-semibold leading-none">{fe.due_day}</span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-800">{fe.description}</p>
          <p className="flex items-center gap-1.5 text-xs text-zinc-500">
            {category ? <><Dot color={category.color} />{category.name}</> : "Sem categoria"}
          </p>
        </div>
      </div>

      {editing ? (
        <ActionForm action={updateFixedAmount.bind(null, fe.id)} className="flex items-center gap-2" compact submitLabel="OK" onSuccess={() => setEditing(false)}>
          <input name="amount" defaultValue={String(fe.amount).replace(".", ",")} inputMode="decimal" className={`${inputCls} w-28`} autoFocus />
        </ActionForm>
      ) : (
        <span className="text-sm font-semibold tabular-nums">{money(item.amount)}</span>
      )}

      {item.paid ? <Badge tone="emerald">Pago</Badge> : <Badge tone="amber">Pendente</Badge>}

      <div className="flex items-center">
        {item.paid && item.paymentId ? (
          <ActionButton action={unmarkFixedPaid.bind(null, item.paymentId)} title="Desmarcar pagamento" className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
            <Undo2 className="size-4" />
          </ActionButton>
        ) : (
          <ActionButton action={markFixedPaid.bind(null, fe.id, ym, fe.amount)} title="Marcar como pago" className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50">
            <Check className="size-4" />
          </ActionButton>
        )}
        <button type="button" onClick={() => setEditing((v) => !v)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" title="Alterar valor" aria-label="Alterar valor">
          <Pencil className="size-4" />
        </button>
        <ActionButton
          action={endFixedExpense.bind(null, fe.id, ym)}
          confirm={`Encerrar "${fe.description}"? Ela continua no histórico, mas deixa de contar a partir do mês seguinte.`}
          title="Encerrar a partir do próximo mês"
          className="rounded-md p-1.5 text-zinc-400 hover:bg-amber-50 hover:text-amber-600"
        >
          <Power className="size-4" />
        </ActionButton>
        <ActionButton action={deleteFixedExpense.bind(null, fe.id)} confirm={`Excluir "${fe.description}" e todo o histórico de pagamentos?`} title="Excluir">
          <Trash2 className="size-4" />
        </ActionButton>
      </div>
    </li>
  );
}

export function ReactivateButton({ id }: { id: string }) {
  return (
    <ActionButton action={reactivateFixedExpense.bind(null, id)} title="Reativar" className="rounded-md p-1.5 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600">
      <RotateCcw className="size-4" />
    </ActionButton>
  );
}
