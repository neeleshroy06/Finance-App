"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SplitPanel } from "@/components/split-panel";
import { cn } from "@/lib/utils";
import {
  Category,
  CATEGORY_LABELS,
  formatAmount,
  SplitInput,
  Transaction,
} from "@/lib/types";

interface TransactionRowProps {
  transaction: Transaction;
  onCategorize: (id: string, category: Category) => void;
  onSplit: (id: string, splits: SplitInput[]) => void;
  isRemoving?: boolean;
}

const categoryStyles: Record<Category, string> = {
  food: "bg-orange-500/20 text-orange-400 border-orange-500/40 hover:bg-orange-500/30",
  other: "bg-violet-500/20 text-violet-400 border-violet-500/40 hover:bg-violet-500/30",
  friend: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/30",
  extra: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30",
  refund: "bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30",
  skip: "bg-slate-500/20 text-slate-400 border-slate-500/40 hover:bg-slate-500/30",
};

const suggestedRing: Record<Category, string> = {
  food: "ring-2 ring-orange-500/60 ring-offset-1 ring-offset-zinc-950",
  other: "ring-2 ring-violet-500/60 ring-offset-1 ring-offset-zinc-950",
  friend: "ring-2 ring-cyan-500/60 ring-offset-1 ring-offset-zinc-950",
  extra: "ring-2 ring-emerald-500/60 ring-offset-1 ring-offset-zinc-950",
  refund: "ring-2 ring-rose-500/60 ring-offset-1 ring-offset-zinc-950",
  skip: "ring-2 ring-slate-500/60 ring-offset-1 ring-offset-zinc-950",
};

export function TransactionRow({
  transaction,
  onCategorize,
  onSplit,
  isRemoving,
}: TransactionRowProps) {
  const [splitting, setSplitting] = useState(false);

  const date = new Date(transaction.date + "T00:00:00");
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const handleSplitConfirm = (splits: SplitInput[]) => {
    setSplitting(false);
    onSplit(transaction.id, splits);
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-4 transition-all duration-300 sm:p-5",
        isRemoving && "scale-95 opacity-0"
      )}
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium text-zinc-100">
            {transaction.merchant_name ?? "Unknown"}
          </p>
          <p className="text-sm text-zinc-500">{dateLabel}</p>
        </div>
        <p className="text-lg font-semibold tabular-nums text-zinc-200">
          {formatAmount(transaction.amount)}
        </p>
      </div>

      {splitting ? (
        <SplitPanel
          totalAmount={transaction.amount}
          onConfirm={handleSplitConfirm}
          onCancel={() => setSplitting(false)}
          confirmLabel="Done"
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {(["food", "other", "friend", "extra", "refund", "skip"] as Category[]).map((cat) => (
              <Button
                key={cat}
                variant="category"
                size="category"
                className={cn(
                  categoryStyles[cat],
                  transaction.suggested_category === cat && suggestedRing[cat]
                )}
                onClick={() => onCategorize(transaction.id, cat)}
              >
                {CATEGORY_LABELS[cat]}
              </Button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSplitting(true)}
            className="mt-2 w-full rounded-md border border-zinc-700/80 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
          >
            Split
          </button>
        </>
      )}
    </div>
  );
}
