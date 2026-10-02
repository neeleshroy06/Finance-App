"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { computeCategoryTotals, getTransactionsForCategory } from "@/lib/splits";
import {
  Category,
  CATEGORY_LABELS,
  formatAmount,
  Period,
  PERIOD_LABELS,
  TOTAL_CATEGORIES,
  Transaction,
} from "@/lib/types";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";

function shiftMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const categoryColors: Record<Exclude<Category, "skip" | "refund">, string> = {
  food: "text-orange-400",
  other: "text-violet-400",
  friend: "text-cyan-400",
  extra: "text-emerald-400",
};

const categoryBg: Record<Exclude<Category, "skip" | "refund">, string> = {
  food: "bg-orange-500/10 border-orange-500/20",
  other: "bg-violet-500/10 border-violet-500/20",
  friend: "bg-cyan-500/10 border-cyan-500/20",
  extra: "bg-emerald-500/10 border-emerald-500/20",
};

export function TotalsScreen() {
  const [period, setPeriod] = useState<Period>("week");
  const [month, setMonth] = useState(currentMonth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expanded, setExpanded] = useState<Exclude<Category, "skip" | "refund"> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const monthParam = period === "month" ? `&month=${month}` : "";
      const res = await fetch(`/api/transactions?period=${period}${monthParam}`);
      const data = await res.json();
      setTransactions(data.transactions ?? []);
    } finally {
      setLoading(false);
    }
  }, [period, month]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = computeCategoryTotals(transactions);

  return (
    <div>
      <div className="mb-8 flex rounded-xl bg-zinc-900/60 p-1">
        {(["week", "month", "all"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => {
              setPeriod(p);
              setExpanded(null);
            }}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-medium transition-all",
              period === p
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {p === "month" ? "Month" : PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {period === "month" && (
        <div className="mb-6 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Previous month"
            title="Previous month"
            onClick={() => setMonth((value) => shiftMonth(value, -1))}
            className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="min-w-36 text-center text-sm font-medium text-zinc-200">
            {new Date(`${month}-01T00:00:00`).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <button
            type="button"
            aria-label="Next month"
            title="Next month"
            disabled={month >= currentMonth()}
            onClick={() => setMonth((value) => shiftMonth(value, 1))}
            className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {TOTAL_CATEGORIES.map((cat) => {
            const items = getTransactionsForCategory(transactions, cat);

            return (
              <div key={cat}>
                <button
                  onClick={() => setExpanded(expanded === cat ? null : cat)}
                  className={cn(
                    "w-full rounded-2xl border p-6 text-left transition-all",
                    categoryBg[cat]
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mb-1 text-sm font-medium uppercase tracking-wide text-zinc-500">
                        {CATEGORY_LABELS[cat]}
                      </p>
                      <p
                        className={cn(
                          "text-4xl font-bold tabular-nums tracking-tight",
                          categoryColors[cat]
                        )}
                      >
                        {formatAmount(totals[cat])}
                      </p>
                    </div>
                    {items.length > 0 &&
                      (expanded === cat ? (
                        <ChevronUp className="h-5 w-5 text-zinc-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-zinc-500" />
                      ))}
                  </div>
                </button>

                {expanded === cat && items.length > 0 && (
                  <div className="mt-2 space-y-1 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 animate-fade-in">
                    {items.map(({ transaction: tx, amount }) => (
                      <Link
                        key={tx.id}
                        href={`/history?transaction=${encodeURIComponent(tx.id)}`}
                        className="flex items-center justify-between rounded-md px-2 py-2 text-sm transition-colors hover:bg-zinc-800/70"
                      >
                        <span className="truncate text-zinc-300">
                          {tx.merchant_name}
                          {tx.category === "split" && (
                            <span className="ml-1.5 text-xs text-zinc-600">split</span>
                          )}
                        </span>
                        <span className="ml-2 shrink-0 tabular-nums text-zinc-400">
                          {formatAmount(amount)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
