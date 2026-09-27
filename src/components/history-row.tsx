"use client";

import { Button } from "@/components/ui/button";
import { SplitPanel } from "@/components/split-panel";
import { cn } from "@/lib/utils";
import {
  Category,
  CATEGORIES,
  CATEGORY_LABELS,
  formatAmount,
  SplitInput,
  Transaction,
} from "@/lib/types";

interface HistoryRowProps {
  transaction: Transaction;
  isEditing: boolean;
  onTap: () => void;
  onCategoryChange: (id: string, category: Category) => void;
  onSplitChange: (id: string, splits: SplitInput[]) => void;
}

const badgeStyles: Record<Category, string> = {
  food: "bg-orange-500/20 text-orange-400",
  other: "bg-violet-500/20 text-violet-400",
  friend: "bg-cyan-500/20 text-cyan-400",
  skip: "bg-slate-500/20 text-slate-400",
};

const buttonStyles: Record<Category, string> = {
  food: "bg-orange-500/20 text-orange-400 border-orange-500/40 hover:bg-orange-500/30",
  other: "bg-violet-500/20 text-violet-400 border-violet-500/40 hover:bg-violet-500/30",
  friend: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/30",
  skip: "bg-slate-500/20 text-slate-400 border-slate-500/40 hover:bg-slate-500/30",
};

export function HistoryRow({
  transaction,
  isEditing,
  onTap,
  onCategoryChange,
  onSplitChange,
}: HistoryRowProps) {
  const category = transaction.category!;
  const isSplit = category === "split";
  const date = new Date(transaction.date + "T00:00:00");
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const initialSplits: SplitInput[] | undefined = transaction.splits?.map((s) => ({
    category: s.category,
    amount: s.amount,
  }));

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700">
      <button
        type="button"
        onClick={onTap}
        className="w-full text-left"
      >
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium text-zinc-100">
              {transaction.merchant_name ?? "Unknown"}
            </p>
            <p className="text-sm text-zinc-500">{dateLabel}</p>
          </div>
          <p className="text-lg font-semibold tabular-nums text-zinc-200">
            {formatAmount(transaction.amount, true)}
          </p>
        </div>
      </button>

      <div className="mt-3">
        {isEditing && isSplit ? (
          <SplitPanel
            totalAmount={transaction.amount}
            initialSplits={initialSplits}
            confirmLabel="Save"
            onConfirm={(splits) => onSplitChange(transaction.id, splits)}
            onCancel={onTap}
          />
        ) : isEditing ? (
          <div className="grid w-full grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant="category"
                size="category"
                className={cn(
                  buttonStyles[cat],
                  category === cat &&
                    "ring-2 ring-zinc-400/60 ring-offset-1 ring-offset-zinc-950"
                )}
                onClick={() => onCategoryChange(transaction.id, cat)}
              >
                {CATEGORY_LABELS[cat]}
              </Button>
            ))}
          </div>
        ) : (
          <button type="button" onClick={onTap} className="flex w-full justify-end rounded-full">
            {isSplit && transaction.splits ? (
              <div className="flex flex-wrap justify-end gap-1">
                {transaction.splits.map((split) => (
                  <span
                    key={split.id}
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                      badgeStyles[split.category]
                    )}
                  >
                    {CATEGORY_LABELS[split.category]} {formatAmount(split.amount)}
                  </span>
                ))}
              </div>
            ) : (
              <span
                className={cn(
                  "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                  badgeStyles[category as Category]
                )}
              >
                {CATEGORY_LABELS[category as Category]}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
