# Gastos

Gerenciador de gastos e painel financeiro pessoal, feito com Next.js 16 e Supabase.

## Funcionalidades

- **Contas de usuário**: cadastro e login com e-mail e senha (Supabase Auth). Cada usuário só vê os próprios dados (Row Level Security).
- **Painel**: receitas, despesas, saldo, taxa de poupança, gastos por categoria, evolução de 6 meses, nota de saúde financeira e principais alertas.
- **Lançamentos**: compras do dia a dia (Pix, débito, dinheiro, boleto) e receitas extras.
- **Despesas fixas**: contas recorrentes com vencimento, marcação de pago/pendente por mês, alteração de valor e encerramento.
- **Cartões de crédito**: cadastro com limite, fechamento e vencimento. As compras caem automaticamente na fatura certa, e as parceladas são distribuídas nos meses seguintes. Mostra o limite comprometido e as parcelas futuras.
- **Histórico**: 12 meses de receitas x despesas, composição dos gastos, tabela mês a mês, evolução por categoria e busca de lançamentos.
- **Investimentos**: aplicações por tipo, aportes e resgates, saldo atual, rendimento, distribuição da carteira e reserva de emergência.
- **Insights**: regra 50/30/20, orçamentos por categoria, alertas (gastos acima da média, limite do cartão, parcelas, reserva, projeção do mês, gastos pequenos) e simulações de economia.
- **Configurações**: nome, renda mensal fixa, categorias (necessidade ou estilo de vida) e limites mensais.

## Configuração

1. No Supabase, abra o **SQL Editor**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e execute.
2. Em **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (em produção, a URL do seu deploy)
   - **Redirect URLs**: adicione `http://localhost:3000/auth/confirm` (e a de produção)
3. Copie `.env.example` para `.env.local` e preencha com a URL e a publishable key do projeto (**Project Settings → API**).
4. Rode:

```bash
npm install
npm run dev
```

Abra http://localhost:3000 e crie sua conta.

> Se não quiser confirmar e-mail no cadastro, desative **Authentication → Sign In / Providers → Email → Confirm email**.

## Estrutura

- `src/app/(auth)`: login e cadastro
- `src/app/(app)`: telas logadas (painel, lançamentos, despesas fixas, cartões, histórico, investimentos, insights, configurações)
- `src/app/actions`: server actions (gravação no Supabase)
- `src/lib/finance.ts`: cálculos mensais, faturas e investimentos
- `src/lib/insights.ts`: geração dos insights e da nota de saúde financeira
- `src/proxy.ts`: renova a sessão e protege as rotas
- `supabase/schema.sql`: tabelas, RLS, triggers e categorias padrão
