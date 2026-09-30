import type { Metadata } from "next";
import { createCategory, updateProfile } from "@/app/actions/settings";
import { ActionForm } from "@/components/action-form";
import { CategoryRow } from "@/components/category-row";
import { Card, Field, PageHeader, inputCls } from "@/components/ui";
import { loadFinance } from "@/lib/data";
import { currentMonth } from "@/lib/months";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const [data, user] = await Promise.all([loadFinance(currentMonth(), 0), getCurrentUser()]);
  const expense = data.categories.filter((c) => c.kind === "expense");
  const income = data.categories.filter((c) => c.kind === "income");

  return (
    <>
      <PageHeader title="Configurações" subtitle="Seu perfil, renda e categorias de gastos." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6">
          <Card title="Perfil">
            <ActionForm action={updateProfile}>
              <div className="flex flex-col gap-4">
                <Field label="E-mail">
                  <input value={user?.email ?? ""} disabled className={inputCls} />
                </Field>
                <Field label="Nome">
                  <input name="full_name" defaultValue={data.profile.full_name ?? ""} maxLength={80} className={inputCls} />
                </Field>
                <Field label="Renda mensal fixa (salário líquido)">
                  <input
                    name="monthly_income"
                    inputMode="decimal"
                    defaultValue={String(data.profile.monthly_income).replace(".", ",")}
                    className={inputCls}
                  />
                </Field>
                <p className="text-xs text-zinc-500">
                  Entra como receita em todos os meses. Rendas variáveis (freelas, bônus) você lança em Lançamentos → Receita extra.
                </p>
              </div>
            </ActionForm>
          </Card>

          <Card title="Nova categoria">
            <ActionForm action={createCategory} submitLabel="Criar">
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <input name="color" type="color" defaultValue="#0ea5e9" className="h-9 w-10 cursor-pointer rounded-lg border border-zinc-300" aria-label="Cor" />
                  <input name="name" required maxLength={60} placeholder="Nome" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select name="kind" className={inputCls} defaultValue="expense">
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                  <select name="nature" className={inputCls} defaultValue="lifestyle">
                    <option value="essential">Necessidade</option>
                    <option value="lifestyle">Estilo de vida</option>
                  </select>
                </div>
                <input name="monthly_budget" inputMode="decimal" placeholder="Limite mensal (opcional)" className={inputCls} />
              </div>
            </ActionForm>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card title="Categorias de despesa">
            <p className="mb-2 text-xs text-zinc-500">
              Defina se cada categoria é necessidade ou estilo de vida (usado na regra 50/30/20) e, se quiser, um limite mensal para receber alertas.
            </p>
            <ul className="divide-y divide-zinc-100">
              {expense.map((c) => (
                <CategoryRow key={c.id} category={c} />
              ))}
            </ul>
          </Card>
          <Card title="Categorias de receita">
            <ul className="divide-y divide-zinc-100">
              {income.map((c) => (
                <CategoryRow key={c.id} category={c} />
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
