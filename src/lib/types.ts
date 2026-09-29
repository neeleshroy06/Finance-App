export type Category = "food" | "other" | "friend" | "extra" | "refund" | "skip";

/** Stored on a transaction when it was split across categories. */
export type TransactionCategory = Category | "split";

export type Period = "week" | "month" | "all";

export interface TransactionSplit {
  id: string;
  transaction_id: string;
  category: Category;
  amount: number;
}

export interface SplitInput {
  category: Category;
  amount: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  plaid_transaction_id: string;
  merchant_name: string | null;
  amount: number;
  date: string;
  category: TransactionCategory | null;
  suggested_category?: Category | null;
  splits?: TransactionSplit[];
  created_at: string;
}

export interface MerchantRule {
  user_id: string;
  merchant_name: string;
  category: Category;
}

export const CATEGORIES: Category[] = ["food", "other", "friend", "extra", "refund", "skip"];

export const CATEGORY_LABELS: Record<Category, string> = {
  food: "Food",
  other: "Other",
  friend: "Friend",
  extra: "Extra",
  refund: "Refund",
  skip: "Skip",
};

export const TOTAL_CATEGORIES: Exclude<Category, "skip" | "refund">[] = [
  "food",
  "other",
  "friend",
  "extra",
];

export const PERIOD_LABELS: Record<Period, string> = {
  week: "This week",
  month: "This month",
  all: "All time",
};

export function formatAmount(amount: number): string {
  const value = Math.abs(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getPeriodStart(period: Period): Date | null {
  const now = new Date();
  if (period === "all") return null;
  if (period === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function isInPeriod(dateStr: string, period: Period): boolean {
  const start = getPeriodStart(period);
  if (!start) return true;
  return new Date(dateStr) >= start;
}
