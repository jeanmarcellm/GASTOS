import type { FinanceData } from "./data";
import {
  cardStatus,
  futureInstallments,
  investmentSummaries,
  monthSeries,
  monthSummary,
  netContributions,
  UNCATEGORIZED,
} from "./finance";
import { money, percent } from "./format";
import { currentMonth, daysInMonth, monthLabel, todayISO } from "./months";

export type InsightLevel = "danger" | "warning" | "info" | "positive";

export type Insight = {
  id: string;
  level: InsightLevel;
  title: string;
  detail: string;
};

const ORDER: Record<InsightLevel, number> = { danger: 0, warning: 1, info: 2, positive: 3 };

export function generateInsights(data: FinanceData, ym: string): Insight[] {
  const out: Insight[] = [];
  const push = (i: Insight) => out.push(i);

  const s = monthSummary(data, ym);
  const history = monthSeries(data, ym, 4).slice(0, 3); // 3 meses anteriores
  const prev = history[history.length - 1];
  const withExpenses = history.filter((h) => h.expenses > 0);
  const avgExpenses = withExpenses.length
    ? withExpenses.reduce((a, h) => a + h.expenses, 0) / withExpenses.length
    : s.expenses;
  // Meses em que o usuário já registrava lançamentos (evita médias infladas no começo)
  const withData = history.filter((h) => h.expenseTx.length > 0);

  if (s.expenses === 0 && s.income === 0) {
    push({
      id: "empty",
      level: "info",
      title: "Comece cadastrando sua renda e seus gastos",
      detail:
        "Informe sua renda mensal em Configurações e registre despesas fixas, compras no cartão e outros gastos para receber análises personalizadas.",
    });
    return out;
  }

  // 1. Taxa de poupança
  if (s.income > 0) {
    if (s.balance < 0) {
      push({
        id: "negative-balance",
        level: "danger",
        title: `Você gastou ${money(-s.balance)} a mais do que ganhou`,
        detail: `As despesas de ${monthLabel(ym)} somam ${money(s.expenses)} contra ${money(s.income)} de receitas. Revise os gastos variáveis e evite novas parcelas até equilibrar o mês.`,
      });
    } else if (s.savingsRate < 0.1) {
      push({
        id: "low-savings",
        level: "warning",
        title: `Você está guardando só ${percent(s.savingsRate)} da renda`,
        detail: "O ideal é poupar pelo menos 20% todo mês. Tente definir um valor fixo para investir logo que o salário cair.",
      });
    } else if (s.savingsRate >= 0.2) {
      push({
        id: "good-savings",
        level: "positive",
        title: `Ótimo! Sobraram ${percent(s.savingsRate)} da sua renda`,
        detail: `Sobra de ${money(s.balance)} neste mês. Direcione esse valor para investimentos antes que ele vire gasto.`,
      });
    }
  } else {
    push({
      id: "no-income",
      level: "info",
      title: "Cadastre sua renda mensal",
      detail: "Sem a renda não dá para calcular quanto você está poupando. Informe o valor em Configurações.",
    });
  }

  // 2. Variação em relação ao mês anterior
  if (prev && prev.expenses > 0 && s.expenses > 0) {
    const change = (s.expenses - prev.expenses) / prev.expenses;
    if (change >= 0.15) {
      push({
        id: "month-up",
        level: "warning",
        title: `Gastos ${percent(change)} maiores que no mês anterior`,
        detail: `Foram ${money(s.expenses)} contra ${money(prev.expenses)} em ${monthLabel(prev.ym)}.`,
      });
    } else if (change <= -0.1) {
      push({
        id: "month-down",
        level: "positive",
        title: `Gastos ${percent(-change)} menores que no mês anterior`,
        detail: `Você economizou ${money(prev.expenses - s.expenses)} em relação a ${monthLabel(prev.ym)}.`,
      });
    }
  }

  // 3. Categorias fora da média dos últimos 3 meses
  if (withData.length) {
    for (const cat of s.byCategory.filter((c) => c.id !== UNCATEGORIZED.id)) {
      const past = withData.map((h) => h.byCategory.find((c) => c.id === cat.id)?.total ?? 0);
      const avg = past.reduce((a, b) => a + b, 0) / withData.length;
      if (avg > 0 && cat.total > avg * 1.3 && cat.total - avg >= 100) {
        push({
          id: `cat-up-${cat.id}`,
          level: "warning",
          title: `${cat.name}: ${percent((cat.total - avg) / avg)} acima da sua média`,
          detail: `Gasto de ${money(cat.total)} neste mês contra média de ${money(avg)} nos meses anteriores.`,
        });
      }
    }
  }

  // 4. Orçamentos por categoria
  for (const cat of s.byCategory) {
    if (!cat.budget) continue;
    const ratio = cat.total / cat.budget;
    if (ratio > 1) {
      push({
        id: `budget-over-${cat.id}`,
        level: "danger",
        title: `Orçamento de ${cat.name} estourado`,
        detail: `Você gastou ${money(cat.total)} de um limite de ${money(cat.budget)} (${money(cat.total - cat.budget)} acima).`,
      });
    } else if (ratio >= 0.8) {
      push({
        id: `budget-near-${cat.id}`,
        level: "warning",
        title: `${cat.name} já usou ${percent(ratio)} do orçamento`,
        detail: `Restam ${money(cat.budget - cat.total)} para o resto do mês.`,
      });
    }
  }

  // 5. Peso das despesas fixas
  if (s.income > 0 && s.fixedTotal / s.income > 0.5) {
    push({
      id: "fixed-heavy",
      level: "warning",
      title: `Despesas fixas consomem ${percent(s.fixedTotal / s.income)} da renda`,
      detail: "Custos fixos altos deixam pouca margem para imprevistos. Renegocie planos, assinaturas e contratos que puder.",
    });
  }

  // 6. Regra 50/30/20
  if (s.income > 0) {
    const ess = s.essential / s.income;
    const life = s.lifestyle / s.income;
    if (ess > 0.5) {
      push({
        id: "rule-essential",
        level: "info",
        title: `Necessidades somam ${percent(ess)} da renda (meta: 50%)`,
        detail: "Moradia, mercado, transporte, saúde e contas passaram da faixa recomendada pela regra 50/30/20.",
      });
    }
    if (life > 0.3) {
      push({
        id: "rule-lifestyle",
        level: "warning",
        title: `Estilo de vida somou ${percent(life)} da renda (meta: 30%)`,
        detail: `Restaurantes, lazer, compras e assinaturas somaram ${money(s.lifestyle)}. Reduzir para 30% liberaria ${money(s.lifestyle - s.income * 0.3)} por mês.`,
      });
    }
  }

  // 7. Cartões de crédito
  if (s.expenses > 0 && s.cardTotal / s.expenses > 0.6) {
    push({
      id: "card-share",
      level: "info",
      title: `${percent(s.cardTotal / s.expenses)} dos gastos passaram pelo cartão`,
      detail: "Concentrar no cartão facilita perder o controle. Acompanhe a fatura durante o mês, não só no vencimento.",
    });
  }
  for (const card of data.cards) {
    const st = cardStatus(data, card, ym);
    if (card.credit_limit > 0 && st.usage >= 0.7) {
      push({
        id: `card-limit-${card.id}`,
        level: st.usage >= 0.9 ? "danger" : "warning",
        title: `${card.name}: ${percent(st.usage)} do limite comprometido`,
        detail: `${money(st.outstanding)} em faturas abertas e parcelas futuras, de um limite de ${money(card.credit_limit)}.`,
      });
    }
  }

  // 8. Parcelas futuras
  const upcoming = futureInstallments(data, ym, 3);
  const upcomingTotal = upcoming.reduce((a, u) => a + u.total, 0);
  if (upcomingTotal > 0) {
    const heavy = s.income > 0 && upcoming[0].total / s.income > 0.3;
    push({
      id: "installments",
      level: heavy ? "warning" : "info",
      title: `${money(upcomingTotal)} já comprometidos em parcelas nos próximos 3 meses`,
      detail: upcoming
        .filter((u) => u.total > 0)
        .map((u) => `${monthLabel(u.ym)}: ${money(u.total)}`)
        .join(" · "),
    });
  }

  // 9. Reserva de emergência
  const inv = investmentSummaries(data);
  const reserveItems = data.investments.filter((i) => i.is_emergency || i.type === "reserva");
  const fmtMonths = (m: number) => m.toFixed(1).replace(".", ",");
  if (!reserveItems.length) {
    push({
      id: "emergency-none",
      level: inv.current > 0 ? "info" : "warning",
      title:
        inv.current > 0
          ? "Nenhum investimento está marcado como reserva de emergência"
          : "Você ainda não tem reserva de emergência",
      detail:
        inv.current > 0
          ? `Você tem ${money(inv.current)} investidos. Se parte disso é sua reserva, use "Marcar como reserva" na aba Investimentos para acompanhar quantos meses ela cobre.`
          : `O recomendado é guardar 6 meses de gastos${avgExpenses > 0 ? ` (${money(avgExpenses * 6)})` : ""} em uma aplicação de liquidez diária.`,
    });
  } else if (inv.emergency <= 0) {
    push({
      id: "emergency-zero",
      level: "warning",
      title: "Sua reserva de emergência está com saldo zerado",
      detail: `Atualize o saldo de ${reserveItems.map((i) => i.name).join(", ")} na aba Investimentos.`,
    });
  } else if (avgExpenses > 0) {
    const months = inv.emergency / avgExpenses;
    const target = avgExpenses * 6;
    if (months >= 6) {
      push({
        id: "emergency-ok",
        level: "positive",
        title: `Reserva de emergência completa: cobre ${fmtMonths(months)} meses`,
        detail: `Você tem ${money(inv.emergency)} guardados. Com a reserva garantida, o excedente pode ir para investimentos de prazo mais longo.`,
      });
    } else {
      push({
        id: "emergency-partial",
        level: months < 1 ? "danger" : months < 3 ? "warning" : "info",
        title: `Sua reserva cobre ${fmtMonths(months)} de 6 meses recomendados`,
        detail: `Você tem ${money(inv.emergency)} guardados. Faltam ${money(target - inv.emergency)} para chegar a 6 meses de gastos (${money(target)}).`,
      });
    }
  }

  // 10. Aportes do mês
  const contributions = netContributions(data, ym);
  if (s.income > 0 && contributions > 0 && contributions / s.income >= 0.1) {
    push({
      id: "invested",
      level: "positive",
      title: `Você investiu ${money(contributions)} este mês`,
      detail: `Isso representa ${percent(contributions / s.income)} da sua renda. Continue!`,
    });
  }

  // 11. Gastos formiga
  const small = s.expenseTx.filter((t) => t.amount < 50);
  const smallTotal = small.reduce((a, t) => a + t.amount, 0);
  if (small.length >= 10) {
    push({
      id: "small-purchases",
      level: "info",
      title: `${small.length} compras pequenas somaram ${money(smallTotal)}`,
      detail: "Cafés, lanches e apps de entrega abaixo de R$ 50 parecem inofensivos, mas somados pesam no orçamento.",
    });
  }

  // 12. Projeção para o mês atual
  if (ym === currentMonth()) {
    const today = todayISO();
    const day = Number(today.slice(8, 10));
    const variable = s.expenseTx
      .filter((t) => t.payment_method !== "credit_card" && t.date <= today)
      .reduce((a, t) => a + t.amount, 0);
    if (day >= 5 && variable > 0) {
      const projected = (variable / day) * daysInMonth(ym);
      const projectedTotal = s.fixedTotal + s.cardTotal + projected;
      if (s.income > 0 && projectedTotal > s.income) {
        push({
          id: "projection",
          level: "warning",
          title: `No ritmo atual o mês fecha em ${money(projectedTotal)}`,
          detail: `Os gastos avulsos estão em ${money(variable / day)} por dia. Mantido esse ritmo, as despesas passam da renda em ${money(projectedTotal - s.income)}.`,
        });
      }
    }

    const unpaidSoon = s.fixedItems.filter(
      (f) => !f.paid && f.expense.due_day >= day && f.expense.due_day <= day + 5,
    );
    if (unpaidSoon.length) {
      push({
        id: "due-soon",
        level: "info",
        title: `${unpaidSoon.length} conta(s) fixa(s) vencem nos próximos 5 dias`,
        detail: unpaidSoon
          .map((f) => `${f.expense.description} (dia ${f.expense.due_day}): ${money(f.amount)}`)
          .join(" · "),
      });
    }
  }

  // 13. Maior categoria e gastos sem categoria
  const uncategorized = s.byCategory.find((c) => c.id === UNCATEGORIZED.id);
  if (uncategorized && s.expenses > 0 && uncategorized.total / s.expenses > 0.2) {
    push({
      id: "uncategorized",
      level: "info",
      title: `${percent(uncategorized.total / s.expenses)} dos gastos estão sem categoria`,
      detail: "Categorize seus lançamentos e despesas fixas para que as análises por categoria e a regra 50/30/20 fiquem precisas.",
    });
  }
  const top = s.byCategory.find((c) => c.id !== UNCATEGORIZED.id);
  if (top && s.expenses > 0) {
    push({
      id: "top-category",
      level: "info",
      title: `${top.name} é sua maior despesa: ${percent(top.total / s.expenses)} do total`,
      detail: `Foram ${money(top.total)} em ${monthLabel(ym)}. Cortar 10% aqui economizaria ${money(top.total * 0.1)} por mês, ${money(top.total * 1.2)} por ano.`,
    });
  }

  return out.sort((a, b) => ORDER[a.level] - ORDER[b.level]);
}

/** Nota de 0 a 100 que resume a saúde financeira do mês. */
export function healthScore(data: FinanceData, ym: string) {
  const s = monthSummary(data, ym);
  const inv = investmentSummaries(data);
  const avg = monthSeries(data, ym, 3).reduce((a, m) => a + m.expenses, 0) / 3 || s.expenses;

  const savings = s.income > 0 ? Math.min(1, Math.max(0, s.savingsRate / 0.2)) : 0;
  const reserve = avg > 0 ? Math.min(1, inv.emergency / (avg * 6)) : 0;
  const fixed = s.income > 0 ? Math.min(1, Math.max(0, 1 - (s.fixedTotal / s.income - 0.3) / 0.4)) : 0;
  const budgets = s.byCategory.filter((c) => c.budget);
  const budget = budgets.length
    ? budgets.filter((c) => c.total <= (c.budget ?? 0)).length / budgets.length
    : 1;

  const score = Math.round(savings * 40 + reserve * 25 + fixed * 20 + budget * 15);
  const label = score >= 80 ? "Excelente" : score >= 60 ? "Boa" : score >= 40 ? "Atenção" : "Crítica";
  return {
    score,
    label,
    parts: [
      { label: "Taxa de poupança", value: savings, weight: 40 },
      { label: "Reserva de emergência", value: reserve, weight: 25 },
      { label: "Peso das despesas fixas", value: fixed, weight: 20 },
      { label: "Orçamentos respeitados", value: budget, weight: 15 },
    ],
  };
}
