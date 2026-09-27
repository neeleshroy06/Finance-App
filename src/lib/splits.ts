import {
  Category,
  SplitInput,
  TOTAL_CATEGORIES,
  Transaction,
} from "./types";

export function toCents(amount: number): number {
  return Math.round(Math.abs(amount) * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function roundMoney(amount: number): number {
  return fromCents(toCents(amount));
}

export function parseMoneyInput(value: string): number {
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return roundMoney(parsed);
}

export function formatMoneyInput(amount: number): string {
  return roundMoney(amount).toFixed(2);
}

export function sumSplitAmounts(splits: SplitInput[]): number {
  const totalCents = splits.reduce((sum, s) => sum + toCents(s.amount), 0);
  return fromCents(totalCents);
}

export function amountsMatch(total: number, splits: SplitInput[]): boolean {
  const targetCents = toCents(total);
  const splitCents = splits.reduce((sum, s) => sum + toCents(s.amount), 0);
  return targetCents === splitCents;
}

export function remainingAmount(total: number, splits: SplitInput[]): number {
  const targetCents = toCents(total);
  const splitCents = splits.reduce((sum, s) => sum + toCents(s.amount), 0);
  return fromCents(targetCents - splitCents);
}

export function computeCategoryTotals(
  transactions: Transaction[]
): Record<Exclude<Category, "skip">, number> {
  const totals = TOTAL_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = 0;
      return acc;
    },
    {} as Record<Exclude<Category, "skip">, number>
  );

  for (const tx of transactions) {
    if (tx.category === "split" && tx.splits?.length) {
      for (const split of tx.splits) {
        if (split.category !== "skip") {
          totals[split.category] += Math.abs(Number(split.amount));
        }
      }
    } else if (
      tx.category === "food" ||
      tx.category === "other" ||
      tx.category === "friend"
    ) {
      totals[tx.category] += Math.abs(Number(tx.amount));
    }
  }

  return totals;
}

export function getTransactionsForCategory(
  transactions: Transaction[],
  category: Exclude<Category, "skip">
): { transaction: Transaction; amount: number }[] {
  const result: { transaction: Transaction; amount: number }[] = [];

  for (const tx of transactions) {
    if (tx.category === "split" && tx.splits?.length) {
      const split = tx.splits.find((s) => s.category === category);
      if (split) {
        result.push({ transaction: tx, amount: split.amount });
      }
    } else if (tx.category === category) {
      result.push({ transaction: tx, amount: tx.amount });
    }
  }

  return result;
}

