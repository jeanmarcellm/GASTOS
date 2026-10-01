import type { Metadata } from "next";
import { createCategory, updateProfile } from "@/app/actions/settings";
import { ActionForm } from "@/components/action-form";
import { CategoryRow } from "@/components/category-row";
import { Field, PageHeader, inputCls } from "@/components/ui";
import { loadFinance } from "@/lib/data";
import { currentMonth } from "@/lib/months";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const [data, user] = await Promise.all([loadFinance(currentMonth(), 0), getCurrentUser()]);
  const expense = data.categories.filter((c) => c.kind === "expense");
  const income = data.categories.filter((c) => c.kind === "income");
  const name = data.profile.full_name || user?.email || "";

  return (
    <>
      <PageHeader
        title="Configurações"
        subtitle="Seu perfil, renda e categorias de gastos."
        dateline={`Conta · ${name}`}
        aside={<span>{data.categories.length} categorias</span>}
        className="mb-14"
      />

      <section className="flex flex-wrap gap-x-[72px] gap-y-16">
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-16">
          <div>
            <h2 className="h2 mb-5">Perfil</h2>
            <ActionForm action={updateProfile}>
              <div className="flex flex-col gap-[18px]">
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
                    defaultValue={data.profile.monthly_income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    className={`${inputCls} tnum`}
                  />
                </Field>
                <p className="text-[13px] leading-[1.55] text-neutral-700">
                  Entra como receita em todos os meses. Rendas variáveis (freelas, bônus) você lança em Lançamentos → Receita extra.
                </p>
              </div>
            </ActionForm>
          </div>

          <div>
            <h2 className="h2 mb-5">Nova categoria</h2>
            <ActionForm action={createCategory} submitLabel="Criar">
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input name="color" type="color" defaultValue="#0ea5e9" className={`${inputCls} w-12! flex-none`} aria-label="Cor" />
                  <input name="name" required maxLength={60} placeholder="Nome" className={inputCls} aria-label="Nome" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select name="kind" className={inputCls} defaultValue="expense" aria-label="Tipo">
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                  <select name="nature" className={inputCls} defaultValue="lifestyle" aria-label="Natureza">
                    <option value="lifestyle">Estilo de vida</option>
                    <option value="essential">Necessidade</option>
                  </select>
                </div>
                <input name="monthly_budget" inputMode="decimal" placeholder="Limite mensal (opcional)" className={`${inputCls} tnum`} aria-label="Limite mensal" />
              </div>
            </ActionForm>
          </div>
        </div>

        <div className="flex min-w-0 flex-[2_1_460px] flex-col gap-16">
          <div>
            <h2 className="h2 mb-2">Categorias de despesa</h2>
            <p className="mb-4 max-w-[64ch] text-sm leading-[1.55] text-neutral-700">
              Defina se cada categoria é necessidade ou estilo de vida (usado na regra 50/30/20) e, se quiser, um limite mensal para receber alertas.
            </p>
            <ul className="border-t border-divider">
              {expense.map((c) => (
                <CategoryRow key={c.id} category={c} />
              ))}
            </ul>
          </div>
          <div>
            <h2 className="h2 mb-4">Categorias de receita</h2>
            <ul className="border-t border-divider">
              {income.map((c) => (
                <CategoryRow key={c.id} category={c} />
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
