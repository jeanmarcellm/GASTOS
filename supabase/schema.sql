-- =============================================================================
-- GASTOS — schema do banco de dados (Supabase / Postgres 15+)
--
-- Como usar: abra o SQL Editor do seu projeto no Supabase, cole este arquivo
-- inteiro e clique em "Run". O script é idempotente nas partes principais
-- (usa IF NOT EXISTS / OR REPLACE), mas foi pensado para rodar num banco vazio.
--
-- Todas as tabelas têm Row Level Security: cada usuário só enxerga e altera
-- os próprios registros. A coluna user_id é preenchida automaticamente com
-- auth.uid(), então o app nunca precisa enviá-la.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Perfis (1:1 com auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  full_name      text,
  monthly_income numeric(12, 2) not null default 0 check (monthly_income >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Categorias (de despesa e de receita), com orçamento mensal opcional
--   nature: essential = necessidades (regra 50/30/20), lifestyle = desejos
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 60),
  kind           text not null default 'expense' check (kind in ('expense', 'income')),
  nature         text check (nature in ('essential', 'lifestyle')),
  color          text not null default '#64748b',
  monthly_budget numeric(12, 2) check (monthly_budget is null or monthly_budget >= 0),
  created_at     timestamptz not null default now(),
  unique (user_id, kind, name),
  unique (id, user_id)
);

-- -----------------------------------------------------------------------------
-- Cartões de crédito
-- -----------------------------------------------------------------------------
create table if not exists public.credit_cards (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 60),
  brand        text,
  credit_limit numeric(12, 2) not null default 0 check (credit_limit >= 0),
  closing_day  smallint not null check (closing_day between 1 and 31),
  due_day      smallint not null check (due_day between 1 and 31),
  color        text not null default '#6366f1',
  created_at   timestamptz not null default now(),
  unique (id, user_id)
);

-- -----------------------------------------------------------------------------
-- Despesas fixas (recorrentes todo mês: aluguel, internet, academia...)
--   start_month / end_month são sempre o dia 1 do mês.
-- -----------------------------------------------------------------------------
create table if not exists public.fixed_expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  description text not null check (char_length(description) between 1 and 120),
  amount      numeric(12, 2) not null check (amount > 0),
  category_id uuid,
  due_day     smallint not null default 10 check (due_day between 1 and 31),
  active      boolean not null default true,
  start_month date not null default date_trunc('month', now())::date,
  end_month   date,
  created_at  timestamptz not null default now(),
  unique (id, user_id),
  foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete set null (category_id),
  check (end_month is null or end_month >= start_month)
);

-- Pagamentos das despesas fixas (um por despesa por mês)
create table if not exists public.fixed_expense_payments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fixed_expense_id uuid not null,
  month            date not null check (extract(day from month) = 1),
  amount           numeric(12, 2) not null check (amount >= 0),
  paid_at          timestamptz not null default now(),
  unique (fixed_expense_id, month),
  foreign key (fixed_expense_id, user_id)
    references public.fixed_expenses (id, user_id) on delete cascade
);

-- -----------------------------------------------------------------------------
-- Lançamentos: compras avulsas, compras no cartão (uma linha por parcela)
-- e receitas extras.
--   date            = data da compra
--   reference_month = mês em que o valor pesa no orçamento (dia 1).
--                     Para cartão é o mês de vencimento da fatura da parcela.
--   group_id        = agrupa as parcelas de uma mesma compra
-- -----------------------------------------------------------------------------
create table if not exists public.transactions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind               text not null default 'expense' check (kind in ('expense', 'income')),
  description        text not null check (char_length(description) between 1 and 120),
  amount             numeric(12, 2) not null check (amount > 0),
  date               date not null default current_date,
  reference_month    date not null check (extract(day from reference_month) = 1),
  category_id        uuid,
  payment_method     text not null default 'pix'
                       check (payment_method in ('pix', 'debit', 'cash', 'credit_card', 'boleto', 'transfer', 'other')),
  credit_card_id     uuid,
  installment_number smallint not null default 1 check (installment_number >= 1),
  installments_total smallint not null default 1 check (installments_total between 1 and 72),
  group_id           uuid not null default gen_random_uuid(),
  notes              text,
  created_at         timestamptz not null default now(),
  foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete set null (category_id),
  foreign key (credit_card_id, user_id)
    references public.credit_cards (id, user_id) on delete cascade,
  check (installment_number <= installments_total),
  check ((payment_method = 'credit_card') = (credit_card_id is not null))
);

-- -----------------------------------------------------------------------------
-- Investimentos e movimentações (aportes / resgates)
-- -----------------------------------------------------------------------------
create table if not exists public.investments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 80),
  type             text not null default 'renda_fixa'
                     check (type in ('reserva', 'renda_fixa', 'tesouro', 'acoes', 'fii', 'fundos', 'cripto', 'previdencia', 'exterior', 'outros')),
  institution      text,
  current_value    numeric(14, 2) not null default 0 check (current_value >= 0),
  value_updated_at date not null default current_date,
  is_emergency     boolean not null default false,
  notes            text,
  created_at       timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.investment_movements (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  investment_id uuid not null,
  kind          text not null check (kind in ('deposit', 'withdrawal')),
  amount        numeric(14, 2) not null check (amount > 0),
  date          date not null default current_date,
  notes         text,
  created_at    timestamptz not null default now(),
  foreign key (investment_id, user_id)
    references public.investments (id, user_id) on delete cascade
);

-- -----------------------------------------------------------------------------
-- Índices
-- -----------------------------------------------------------------------------
create index if not exists categories_user_idx         on public.categories (user_id);
create index if not exists credit_cards_user_idx       on public.credit_cards (user_id);
create index if not exists fixed_expenses_user_idx     on public.fixed_expenses (user_id);
create index if not exists fixed_payments_user_idx     on public.fixed_expense_payments (user_id, month);
create index if not exists transactions_user_month_idx on public.transactions (user_id, reference_month);
create index if not exists transactions_group_idx      on public.transactions (group_id);
create index if not exists transactions_card_idx       on public.transactions (credit_card_id);
create index if not exists investments_user_idx        on public.investments (user_id);
create index if not exists inv_movements_inv_idx       on public.investment_movements (investment_id);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.categories             enable row level security;
alter table public.credit_cards           enable row level security;
alter table public.fixed_expenses         enable row level security;
alter table public.fixed_expense_payments enable row level security;
alter table public.transactions           enable row level security;
alter table public.investments            enable row level security;
alter table public.investment_movements   enable row level security;

drop policy if exists "profiles: own row" on public.profiles;
create policy "profiles: own row" on public.profiles
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

do $$
declare
  t text;
begin
  foreach t in array array[
    'categories', 'credit_cards', 'fixed_expenses', 'fixed_expense_payments',
    'transactions', 'investments', 'investment_movements'
  ]
  loop
    execute format('drop policy if exists "%1$s: own rows" on public.%1$I', t);
    execute format(
      'create policy "%1$s: own rows" on public.%1$I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))',
      t
    );
  end loop;
end
$$;

-- -----------------------------------------------------------------------------
-- updated_at automático em profiles
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Novo usuário: cria o perfil e as categorias padrão
-- -----------------------------------------------------------------------------
-- seed_user é idempotente: pode rodar de novo sem duplicar nada.
drop function if exists public.seed_user(uuid, text);
create or replace function public.seed_user(p_user_id uuid, p_full_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (p_user_id, nullif(p_full_name, ''))
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, kind, nature, color)
  values
    (p_user_id, 'Moradia',            'expense', 'essential', '#6366f1'),
    (p_user_id, 'Mercado',            'expense', 'essential', '#16a34a'),
    (p_user_id, 'Contas e serviços',  'expense', 'essential', '#0ea5e9'),
    (p_user_id, 'Transporte',         'expense', 'essential', '#f59e0b'),
    (p_user_id, 'Saúde',              'expense', 'essential', '#ef4444'),
    (p_user_id, 'Educação',           'expense', 'essential', '#8b5cf6'),
    (p_user_id, 'Pets',               'expense', 'essential', '#a16207'),
    (p_user_id, 'Restaurantes',       'expense', 'lifestyle', '#f97316'),
    (p_user_id, 'Lazer',              'expense', 'lifestyle', '#ec4899'),
    (p_user_id, 'Compras',            'expense', 'lifestyle', '#14b8a6'),
    (p_user_id, 'Assinaturas',        'expense', 'lifestyle', '#64748b'),
    (p_user_id, 'Viagem',             'expense', 'lifestyle', '#06b6d4'),
    (p_user_id, 'Presentes',          'expense', 'lifestyle', '#d946ef'),
    (p_user_id, 'Outros',             'expense', 'lifestyle', '#94a3b8'),
    (p_user_id, 'Salário',            'income',  null,        '#16a34a'),
    (p_user_id, 'Freelance',          'income',  null,        '#0ea5e9'),
    (p_user_id, 'Rendimentos',        'income',  null,        '#8b5cf6'),
    (p_user_id, 'Outras receitas',    'income',  null,        '#94a3b8')
  on conflict (user_id, kind, name) do nothing;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.seed_user(new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Essas funções só devem ser chamadas pelo banco, nunca via API.
revoke execute on function public.seed_user(uuid, text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Usuários que se cadastraram antes deste script rodar também recebem
-- perfil e categorias padrão.
select public.seed_user(id, raw_user_meta_data ->> 'full_name') from auth.users;

-- -----------------------------------------------------------------------------
-- Permissões das tabelas para usuários logados (o RLS acima filtra as linhas)
-- -----------------------------------------------------------------------------
grant select, insert, update, delete on
  public.profiles, public.categories, public.credit_cards, public.fixed_expenses,
  public.fixed_expense_payments, public.transactions, public.investments,
  public.investment_movements
to authenticated;

-- Faz a API do Supabase enxergar as tabelas novas imediatamente.
notify pgrst, 'reload schema';
