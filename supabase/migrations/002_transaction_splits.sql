-- Allow transactions to be marked as split across categories
alter table transactions drop constraint if exists transactions_category_check;
alter table transactions add constraint transactions_category_check
  check (category in ('food','other','friend','skip','split'));

create table if not exists transaction_splits (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  category text check (category in ('food','other','friend','skip')) not null,
  amount numeric not null check (amount > 0),
  created_at timestamptz default now()
);

create index if not exists transaction_splits_transaction_id_idx
  on transaction_splits (transaction_id);
create index if not exists transaction_splits_user_id_idx
  on transaction_splits (user_id);

alter table transaction_splits enable row level security;

create policy "Users manage own splits"
  on transaction_splits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
