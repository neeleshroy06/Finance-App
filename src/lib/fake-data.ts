import { amountsMatch } from "./splits";
import { Category, MerchantRule, SplitInput, Transaction, TransactionSplit } from "./types";

const DEMO_USER = "00000000-0000-0000-0000-000000000001";

const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

let transactions: Transaction[] = [
  { id: "1", user_id: DEMO_USER, plaid_transaction_id: "p1", merchant_name: "Sweetgreen", amount: 14.35, date: daysAgo(0), category: null, suggested_category: "food", created_at: new Date().toISOString() },
  { id: "2", user_id: DEMO_USER, plaid_transaction_id: "p2", merchant_name: "Group Dinner", amount: 500.00, date: daysAgo(0), category: null, created_at: new Date().toISOString() },
  { id: "3", user_id: DEMO_USER, plaid_transaction_id: "p3", merchant_name: "Venmo", amount: 45.00, date: daysAgo(1), category: null, suggested_category: "skip", created_at: new Date().toISOString() },
  { id: "4", user_id: DEMO_USER, plaid_transaction_id: "p4", merchant_name: "Trader Joe's", amount: 67.23, date: daysAgo(1), category: null, suggested_category: "food", created_at: new Date().toISOString() },
  { id: "5", user_id: DEMO_USER, plaid_transaction_id: "p5", merchant_name: "Netflix", amount: 15.99, date: daysAgo(2), category: null, created_at: new Date().toISOString() },
  { id: "6", user_id: DEMO_USER, plaid_transaction_id: "p6", merchant_name: "Blue Bottle Coffee", amount: 6.75, date: daysAgo(2), category: null, suggested_category: "food", created_at: new Date().toISOString() },
  { id: "7", user_id: DEMO_USER, plaid_transaction_id: "p7", merchant_name: "Amazon", amount: 42.18, date: daysAgo(3), category: null, created_at: new Date().toISOString() },
  { id: "8", user_id: DEMO_USER, plaid_transaction_id: "p8", merchant_name: "Chipotle", amount: 12.45, date: daysAgo(3), category: null, suggested_category: "food", created_at: new Date().toISOString() },
  { id: "9", user_id: DEMO_USER, plaid_transaction_id: "p9", merchant_name: "ATM Withdrawal", amount: 100.00, date: daysAgo(4), category: null, suggested_category: "skip", created_at: new Date().toISOString() },
  { id: "10", user_id: DEMO_USER, plaid_transaction_id: "p10", merchant_name: "Spotify", amount: 10.99, date: daysAgo(5), category: null, created_at: new Date().toISOString() },
  { id: "c1", user_id: DEMO_USER, plaid_transaction_id: "p11", merchant_name: "Whole Foods", amount: 89.34, date: daysAgo(6), category: "food", created_at: new Date().toISOString() },
  { id: "c2", user_id: DEMO_USER, plaid_transaction_id: "p12", merchant_name: "Dinner with Alex", amount: 55.00, date: daysAgo(7), category: "friend", created_at: new Date().toISOString() },
  { id: "c3", user_id: DEMO_USER, plaid_transaction_id: "p13", merchant_name: "Target", amount: 34.56, date: daysAgo(8), category: "other", created_at: new Date().toISOString() },
  { id: "c4", user_id: DEMO_USER, plaid_transaction_id: "p14", merchant_name: "Sweetgreen", amount: 13.20, date: daysAgo(9), category: "food", created_at: new Date().toISOString() },
  { id: "c5", user_id: DEMO_USER, plaid_transaction_id: "p15", merchant_name: "Venmo", amount: 30.00, date: daysAgo(10), category: "skip", created_at: new Date().toISOString() },
];

let transactionSplits: TransactionSplit[] = [];

let merchantRules: MerchantRule[] = [
  { user_id: DEMO_USER, merchant_name: "Sweetgreen", category: "food" },
  { user_id: DEMO_USER, merchant_name: "Venmo", category: "skip" },
  { user_id: DEMO_USER, merchant_name: "Blue Bottle Coffee", category: "food" },
];

function attachSplits(tx: Transaction): Transaction {
  const splits = transactionSplits.filter((s) => s.transaction_id === tx.id);
  return splits.length ? { ...tx, splits } : tx;
}

function enrichWithSuggestions(tx: Transaction): Transaction {
  const withSplits = attachSplits(tx);
  if (withSplits.category !== null) return withSplits;
  const rule = merchantRules.find(
    (r) => r.merchant_name.toLowerCase() === (tx.merchant_name ?? "").toLowerCase()
  );
  return rule ? { ...withSplits, suggested_category: rule.category } : withSplits;
}

export const fakeStore = {
  getUncategorized(): Transaction[] {
    return transactions
      .filter((t) => t.category === null)
      .map(enrichWithSuggestions)
      .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  },

  getAll(): Transaction[] {
    return [...transactions].map(enrichWithSuggestions);
  },

  getCategorized(): Transaction[] {
    return transactions
      .filter((t) => t.category !== null)
      .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  },

  updateCategory(id: string, category: Category): Transaction | null {
    const idx = transactions.findIndex((t) => t.id === id);
    if (idx === -1 || transactions[idx].category === null) return null;
    transactionSplits = transactionSplits.filter((split) => split.transaction_id !== id);
    transactions[idx] = { ...transactions[idx], category };
    return transactions[idx];
  },

  split(
    id: string,
    splits: SplitInput[]
  ): {
    transaction: Transaction;
    suggest_rule: { merchant_name: string; category: Category } | null;
    error?: string;
  } | null {
    const idx = transactions.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    const tx = transactions[idx];
    if (!amountsMatch(tx.amount, splits)) {
      return { transaction: tx, suggest_rule: null, error: "Split amounts must equal the transaction total" };
    }

    transactionSplits = transactionSplits.filter((s) => s.transaction_id !== id);
    const newSplits: TransactionSplit[] = splits.map((s, i) => ({
      id: `split-${id}-${i}`,
      transaction_id: id,
      category: s.category,
      amount: s.amount,
    }));
    transactionSplits.push(...newSplits);

    transactions[idx] = { ...tx, category: "split" };

    const isEdit = tx.category === "split";
    const hasRule = merchantRules.some(
      (r) =>
        r.merchant_name.toLowerCase() === (tx.merchant_name ?? "").toLowerCase()
    );

    const primaryCategory =
      splits.find((s) => s.category !== "skip")?.category ?? splits[0].category;

    const suggest_rule =
      !isEdit && tx.merchant_name && !hasRule
        ? { merchant_name: tx.merchant_name, category: primaryCategory }
        : null;

    return {
      transaction: attachSplits(transactions[idx]),
      suggest_rule,
    };
  },

  uncategorize(id: string): Transaction | null {
    const idx = transactions.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    transactionSplits = transactionSplits.filter((s) => s.transaction_id !== id);
    transactions[idx] = { ...transactions[idx], category: null };
    return enrichWithSuggestions(transactions[idx]);
  },

  categorize(id: string, category: Category): {
    transaction: Transaction;
    suggest_rule: { merchant_name: string; category: Category } | null;
  } | null {
    const idx = transactions.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const tx = transactions[idx];
    transactions[idx] = { ...tx, category };

    const hasRule = merchantRules.some(
      (r) =>
        r.merchant_name.toLowerCase() === (tx.merchant_name ?? "").toLowerCase()
    );

    const suggest_rule =
      tx.merchant_name && !hasRule
        ? { merchant_name: tx.merchant_name, category }
        : null;

    return { transaction: transactions[idx], suggest_rule };
  },

  createRule(merchantName: string, category: Category): void {
    const existing = merchantRules.findIndex(
      (r) => r.merchant_name.toLowerCase() === merchantName.toLowerCase()
    );
    const rule: MerchantRule = {
      user_id: DEMO_USER,
      merchant_name: merchantName,
      category,
    };
    if (existing >= 0) merchantRules[existing] = rule;
    else merchantRules.push(rule);
  },

  getRules(): MerchantRule[] {
    return [...merchantRules];
  },

  updateRule(merchantName: string, category: Category): void {
    this.createRule(merchantName, category);
  },

  deleteRule(merchantName: string): void {
    merchantRules = merchantRules.filter((r) => r.merchant_name !== merchantName);
  },

  getPlaidConnected(): boolean {
    return false;
  },
};
