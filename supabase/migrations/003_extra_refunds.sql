-- Add explicit categories for extra spending and bank refunds.
alter table transactions drop constraint if exists transactions_category_check;
alter table transactions add constraint transactions_category_check
  check (category in ('food','other','friend','extra','refund','skip','split'));

alter table merchant_rules drop constraint if exists merchant_rules_category_check;
alter table merchant_rules add constraint merchant_rules_category_check
  check (category in ('food','other','friend','extra','refund','skip'));

alter table transaction_splits drop constraint if exists transaction_splits_category_check;
alter table transaction_splits add constraint transaction_splits_category_check
  check (category in ('food','other','friend','extra','refund','skip'));

-- Plaid uses negative amounts for money returned to the account.
update transactions
set category = 'refund'
where amount < 0 and category is null;
