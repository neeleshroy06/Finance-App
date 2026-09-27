# 💸 Transaction Categorizer

> Your bank app shows you *what* you spent. This one helps you decide *what it meant* — in under 30 seconds a day.

Connect a card. Swipe through charges. Tap **Food**, **Other**, **Friend**, or **Skip**. Close the app. Feel briefly like an adult.

No budgets. No pie charts. No “you spent 23% more on avocado toast than last month.” Just four buttons and the sweet dopamine hit of **All caught up**.

---

## The vibe

| Screen | What it does | Mood |
|--------|--------------|------|
| **Review** | Uncategorized charges, one tap each | Calm chore — get in, get out |
| **Totals** | Food / Other / Friend totals | The payoff — big numbers, pretty colors |
| **History** | Fix mistakes, edit splits | “Wait that wasn’t food” |
| **Settings** | Bank link + merchant rules | The plumbing closet |

### The four sacred categories

- **Food** — groceries, coffee, the Sweetgreen you pretend is a personality trait
- **Other** — everything else that isn’t food or a friend
- **Friend** — dinners you’ll Venmo-request later (you won’t)
- **Skip** — transfers, refunds, ATM runs, “this isn’t real spending”

**Skip is not shame.** It’s a trap door. Use it liberally.

### Split mode (for the group dinner liars)

$500 at a restaurant? Hit **Split**. Carve it up — $300 Friend, $200 Skip, $14.35 Food because you’re precise like that. Cents supported. Edit later from History if you fat-fingered it.

---

## Quick start (no bank account required)

Fake data mode is on by default. Live your best financial fantasy locally.

```bash
npm install
npm run dev
```

Open [http://localhost:3000/review](http://localhost:3000/review)

*(If port 3000 is busy, Next.js will yell and use 3001 instead. Listen to it.)*

You’ll get seeded transactions including a suspicious **Group Dinner — $500**. Perfect for split practice.

---

## Real life setup

When you’re ready to stare at your actual spending:

1. Create a [Supabase](https://supabase.com) project
2. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_transaction_splits.sql`
3. Copy `.env.example` → `.env.local` and fill in your keys
4. Set `NEXT_PUBLIC_USE_FAKE_DATA=false`
5. Grab Plaid sandbox keys from [dashboard.plaid.com](https://dashboard.plaid.com)
6. Deploy to [Vercel](https://vercel.com) — cron hits `/api/transactions/sync` daily at 6am UTC

Then sign in on **Settings**. Review will stop giving you the “who are you?” treatment.

---

## How it works (the short version)

```
Plaid syncs charges → they land uncategorized → you tap buttons → totals update → you leave
```

Repeat merchants? The app **suggests** a category (glowing ring) but never auto-submits. You’re still the boss. One tap to confirm.

Merchant rules remember your choices for next time. Sweetgreen will always try to be Food. It’s usually right.

---

## Stack

**Next.js 14** · **Supabase** · **Plaid** · **Tailwind** · **shadcn/ui** · **Vercel**

One web app. One cron job. Zero “we should rewrite this in Rust.”

---

## Explicit non-goals

We are proudly **not** building:

- Budgets
- Investment tracking
- AI that judges your DoorDash habit
- A 47-tab dashboard
- Push notifications guilt-tripping you at 9pm

This is a **daily swipe habit**, not a finance ERP.

---

## Dev tips

- **First compile slow?** Normal on Windows, especially if the project lives in OneDrive. Delete `.next` and restart if things get weird.
- **Stuck loading?** Check you’re on the right port and signed in (or flip fake data back on).
- **Build spec lives in** `agent.md` if you’re an agent, robot, or very enthusiastic human.

---

*Built for people who will never open Mint twice but might tap four buttons every morning.*
