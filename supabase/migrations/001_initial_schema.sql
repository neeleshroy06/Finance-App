-- Transaction Categorizer schema
-- Run in Supabase SQL editor or via supabase db push

-- Transactions
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  plaid_transaction_id text unique not null,
  merchant_name text,
  amount numeric not null,
  date date not null,
  category text check (category in ('food','other','friend','skip')) default null,
  created_at timestamptz default now()
);

create index if not exists transactions_user_id_date_idx on transactions (user_id, date desc);
create index if not exists transactions_user_uncategorized_idx on transactions (user_id) where category is null;

-- Merchant rules: used to pre-select category on /review (user must still tap to confirm)
create table if not exists merchant_rules (
  user_id uuid references auth.users not null,
  merchant_name text not null,
  category text check (category in ('food','other','friend','skip')) not null,
  primary key (user_id, merchant_name)
);

-- Plaid items (access_token stored server-side only — never exposed to client)
create table if not exists plaid_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  access_token text not null,
  item_id text not null,
  cursor text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table transactions enable row level security;
alter table merchant_rules enable row level security;
alter table plaid_items enable row level security;

create policy "Users manage own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own merchant rules"
  on merchant_rules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own plaid items"
  on plaid_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Seed data (replace USER_ID with actual auth.users id after signup)
-- Example:
-- insert into transactions (user_id, plaid_transaction_id, merchant_name, amount, date) values
--   ('YOUR_USER_ID', 'demo-1', 'Sweetgreen', 14.82, current_date),
--   ('YOUR_USER_ID', 'demo-2', 'Uber', 23.50, current_date);
