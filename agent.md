# Transaction Categorizer — Build Spec

One-line pitch: connect your card, review a day's charges in under 30 seconds, tap a category, watch totals update.

## Stack (opinionated, don't deviate)

- **Next.js 14 (App Router)** — single web app, works on mobile via PWA later
- **Supabase** — Postgres + Auth (no need for separate auth provider)
- **Plaid** — transaction sync (`transactions/sync` endpoint, not the old `/get`)
- **Tailwind + shadcn/ui** — fast, no custom design system needed
- **Vercel** — deploy

Don't add: React Native, GraphQL, Redux, a separate backend service. This is a CRUD app with one cron job. Keep it that way.

## Data Model

```sql
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  plaid_transaction_id text unique not null,
  merchant_name text,
  amount numeric not null,
  date date not null,
  category text check (category in ('food','other','friend','skip')) default null,
  created_at timestamptz default now()
);

create table merchant_rules (
  user_id uuid references auth.users not null,
  merchant_name text not null,
  category text check (category in ('food','other','friend','skip')) not null,
  primary key (user_id, merchant_name)
);
```

Row Level Security: every query scoped to `auth.uid() = user_id`.

## Screens (only 3)

### 1. `/review` — the daily screen, this is the whole product

- List of **uncategorized** transactions only, newest first
- Each row: merchant name, amount, date — nothing else
- 4 buttons per row: `Food` `Other` `Friend` `Skip`
- Tap → optimistic UI removes row immediately, writes to DB in background
- If a `merchant_rules` match exists, pre-select that category (still requires one tap to confirm — never auto-submit without user action)
- Empty state: "All caught up" — this is the reward state, make it satisfying (checkmark, subtle animation)
- **Design constraint: no scrolling past ~10 items should feel like work.** If someone has 40 uncategorized transactions, show a progress bar ("12/40") not a wall of rows.

### 2. `/totals` — the payoff screen

- 3 big numbers: Food, Other, Friend (Skip is never shown here — it's excluded, not a category)
- Toggle: This week / This month / All time
- Tap a category → expands to the list of transactions in it (for auditing, low priority)

### 3. `/settings`

- Plaid Link connect/reconnect button
- List of saved merchant rules, editable/deletable

That's it. No dashboard, no charts, no budgets in v1.

## Design choices (deliberate, keep these)

- **One-tap categorization, zero forms.** Buttons, not dropdowns, not modals.
- **Skip is a first-class action, not an edge case.** Venmo transfers, refunds, ATM withdrawals — these need a fast out or people abandon the habit.
- **No decimals-obsessing.** Round to whole dollars in the review list; exact amounts only in totals.
- **Dark, low-contrast palette for `/review`.** This is a chore screen users hit daily — it should feel calm, not like a to-do list guilting them.
- **`/totals` gets more visual weight** (bigger type, color per category) — this is the reward screen.

## Sync logic

- Cron (Vercel Cron or Supabase Edge Function), once daily: call Plaid `transactions/sync`, upsert on `plaid_transaction_id` (handles Plaid's dedup/update behavior natively — don't hand-roll dedup).
- New transactions insert with `category = null`.
- After insert, check `merchant_rules` for a match and set category as a *suggestion* only (see review screen behavior above — still needs a tap).

## Build order (do not reorder)

1. Supabase schema + auth, seed with fake transaction rows
2. `/review` screen against fake data — get the tap-to-categorize loop feeling instant
3. `/totals` screen against fake data
4. Plaid Link + `transactions/sync` cron, wire to real data
5. `merchant_rules` — auto-suggest on repeat merchants
6. Polish: empty states, loading states, progress bar on `/review`

Do not touch Plaid until steps 2–3 feel good with fake data. The categorization UX is the product; the bank connection is plumbing.

## Explicit non-goals for v1

- Budgets or spending limits
- Multiple cards/accounts
- Splitting a single transaction across categories
- Notifications/reminders to open the app