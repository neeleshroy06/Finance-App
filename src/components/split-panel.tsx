"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  amountsMatch,
  formatMoneyInput,
  parseMoneyInput,
  remainingAmount,
} from "@/lib/splits";
import {
  Category,
  CATEGORY_LABELS,
  formatAmount,
  SplitInput,
} from "@/lib/types";
import { Plus, X } from "lucide-react";

interface SplitLine {
  id: string;
  category: Category;
  amount: string;
}

interface SplitPanelProps {
  totalAmount: number;
  initialSplits?: SplitInput[];
  onConfirm: (splits: SplitInput[]) => void;
  onCancel: () => void;
  confirmLabel?: string;
}

const categoryStyles: Record<Category, string> = {
  food: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  other: "bg-violet-500/20 text-violet-400 border-violet-500/40",
  friend: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
  skip: "bg-slate-500/20 text-slate-400 border-slate-500/40",
};

const activeCategoryStyles: Record<Category, string> = {
  food: "bg-orange-500/40 text-orange-300 border-orange-500/60",
  other: "bg-violet-500/40 text-violet-300 border-violet-500/60",
  friend: "bg-cyan-500/40 text-cyan-300 border-cyan-500/60",
  skip: "bg-slate-500/40 text-slate-300 border-slate-500/60",
};

let lineId = 0;
function newLine(category: Category = "food"): SplitLine {
  return { id: `line-${++lineId}`, category, amount: "" };
}

function splitsToLines(splits?: SplitInput[]): SplitLine[] {
  if (splits?.length) {
    return splits.map((split) => ({
      id: `line-${++lineId}`,
      category: split.category,
      amount: formatMoneyInput(split.amount),
    }));
  }
  return [newLine(), newLine("skip")];
}

export function SplitPanel({
  totalAmount,
  initialSplits,
  onConfirm,
  onCancel,
  confirmLabel = "Done",
}: SplitPanelProps) {
  const absTotal = Math.abs(totalAmount);
  const [lines, setLines] = useState<SplitLine[]>(() => splitsToLines(initialSplits));

  const parsedSplits = useMemo((): SplitInput[] => {
    return lines
      .map((line) => ({
        category: line.category,
        amount: parseMoneyInput(line.amount),
      }))
      .filter((s) => s.amount > 0);
  }, [lines]);

  const remaining = remainingAmount(absTotal, parsedSplits);
  const isComplete = amountsMatch(absTotal, parsedSplits) && parsedSplits.length >= 2;

  const updateLine = (id: string, patch: Partial<SplitLine>) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...patch } : line))
    );
  };

  const removeLine = (id: string) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((line) => line.id !== id));
  };

  const addLine = () => {
    setLines((prev) => [...prev, newLine()]);
  };

  const fillRemaining = (id: string) => {
    if (remaining <= 0) return;
    updateLine(id, { amount: formatMoneyInput(remaining) });
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-500">Total {formatAmount(absTotal)}</span>
        <span
          className={cn(
            "font-medium tabular-nums",
            remaining === 0
              ? "text-emerald-400"
              : remaining < 0
                ? "text-red-400"
                : "text-zinc-400"
          )}
        >
          {remaining === 0
            ? "Fully allocated"
            : remaining > 0
              ? `${formatAmount(remaining)} left`
              : `${formatAmount(Math.abs(remaining))} over`}
        </span>
      </div>

      <div className="space-y-2">
        {lines.map((line) => (
          <div key={line.id} className="flex items-center gap-2">
            <div className="grid flex-1 grid-cols-4 gap-1">
              {(["food", "other", "friend", "skip"] as Category[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => updateLine(line.id, { category: cat })}
                  className={cn(
                    "rounded-md border px-1 py-1.5 text-[10px] font-semibold transition-colors sm:text-xs",
                    line.category === cat
                      ? activeCategoryStyles[cat]
                      : categoryStyles[cat]
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            <div className="relative w-24 shrink-0">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={line.amount}
                onChange={(e) => updateLine(line.id, { amount: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800/60 py-1.5 pl-5 pr-1 text-right text-sm tabular-nums text-zinc-100 outline-none focus:border-zinc-500"
              />
            </div>

            {remaining > 0 && !line.amount && (
              <button
                type="button"
                onClick={() => fillRemaining(line.id)}
                className="shrink-0 text-[10px] text-zinc-500 hover:text-zinc-300"
                title="Fill remaining amount"
              >
                Rest
              </button>
            )}

            {lines.length > 2 && (
              <button
                type="button"
                onClick={() => removeLine(line.id)}
                className="shrink-0 text-zinc-600 hover:text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addLine}
        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
      >
        <Plus className="h-3.5 w-3.5" />
        Add split
      </button>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-zinc-700 bg-transparent text-zinc-400 hover:bg-zinc-800"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-40"
          disabled={!isComplete}
          onClick={() => onConfirm(parsedSplits)}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
