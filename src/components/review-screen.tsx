"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { TransactionRow } from "@/components/transaction-row";
import { EmptyReviewState } from "@/components/empty-review-state";
import { ProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import { Category, CATEGORY_LABELS, SplitInput, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

type UndoState = {
  transaction: Transaction;
  kind: "category" | "split";
  category?: Category;
};

const UNDO_DURATION_MS = 8000;

const BATCH_SIZE = 10;

export function ReviewScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"sign_in" | "load_failed" | null>(null);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const initialTotal = useRef(0);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndo = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setUndo(null);
  }, []);

  const queueUndo = useCallback(
    (state: UndoState) => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
      setUndo(state);
      undoTimerRef.current = setTimeout(() => {
        setUndo(null);
        undoTimerRef.current = null;
      }, UNDO_DURATION_MS);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions/uncategorized");
      const data = await res.json();

      if (!res.ok) {
        setTransactions([]);
        setError(res.status === 401 ? "sign_in" : "load_failed");
        return;
      }

      const txs: Transaction[] = data.transactions ?? [];
      setTransactions(txs);
      if (initialTotal.current === 0) {
        initialTotal.current = txs.length;
      }
    } catch {
      setTransactions([]);
      setError("load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const removeTransaction = (id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));

    setTimeout(() => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 250);
  };

  const handleUndo = () => {
    if (!undo) return;
    const { transaction } = undo;
    clearUndo();

    const restored: Transaction = {
      ...transaction,
      category: null,
      splits: undefined,
    };

    setTransactions((prev) => {
      if (prev.some((t) => t.id === transaction.id)) return prev;
      return [restored, ...prev];
    });

    fetch(`/api/transactions/${transaction.id}/uncategorize`, { method: "PATCH" }).catch(
      console.error
    );
  };

  const handleCategorize = (id: string, category: Category) => {
    const tx = transactions.find((t) => t.id === id);
    if (tx) {
      queueUndo({ transaction: tx, kind: "category", category });
    }
    removeTransaction(id);

    fetch(`/api/transactions/${id}/categorize`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    })
      .catch(console.error);
  };

  const handleSplit = (id: string, splits: SplitInput[]) => {
    const tx = transactions.find((t) => t.id === id);
    if (tx) {
      queueUndo({ transaction: tx, kind: "split" });
    }
    removeTransaction(id);

    fetch(`/api/transactions/${id}/split`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ splits }),
    })
      .catch(console.error);
  };

  const visible = transactions.slice(0, BATCH_SIZE);
  const remaining = transactions.length;
  const processed = initialTotal.current - remaining;
  const showProgress = initialTotal.current > BATCH_SIZE;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
        <p className="text-sm text-zinc-600">Loading transactions…</p>
      </div>
    );
  }

  if (error === "sign_in") {
    return (
      <div className="flex flex-col items-center px-6 py-20 text-center">
        <h2 className="mb-2 text-xl font-semibold text-zinc-100">Sign in required</h2>
        <p className="mb-6 max-w-xs text-sm text-zinc-500">
          Sign in on Settings to load your transactions from Supabase.
        </p>
        <Button asChild className="bg-zinc-100 text-zinc-900 hover:bg-white">
          <Link href="/settings">Go to Settings</Link>
        </Button>
      </div>
    );
  }

  if (error === "load_failed") {
    return (
      <div className="flex flex-col items-center px-6 py-20 text-center">
        <h2 className="mb-2 text-xl font-semibold text-zinc-100">Couldn&apos;t load</h2>
        <p className="mb-6 max-w-xs text-sm text-zinc-500">
          Something went wrong fetching transactions. Check your connection and try again.
        </p>
        <Button
          variant="outline"
          className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
          onClick={loadTransactions}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (remaining === 0 && !undo) {
    return <EmptyReviewState />;
  }

  return (
    <div>
      {showProgress && (
        <ProgressBar current={processed} total={initialTotal.current} />
      )}

      {!showProgress && (
        <p className="mb-4 text-sm text-zinc-500">
          {remaining} {remaining === 1 ? "transaction" : "transactions"} to review
        </p>
      )}

      {remaining === 0 && undo && (
        <p className="mb-4 text-center text-sm text-zinc-500">All caught up — undo below if needed</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((tx) => (
          <TransactionRow
            key={tx.id}
            transaction={tx}
            onCategorize={handleCategorize}
            onSplit={handleSplit}
            isRemoving={removingIds.has(tx.id)}
          />
        ))}
      </div>

      {undo && (
        <div
          className={cn(
            "fixed bottom-[4.5rem] left-4 right-4 z-50 mx-auto flex max-w-6xl items-center justify-between gap-3",
            "rounded-xl border border-zinc-700/80 bg-zinc-900 px-4 py-3 shadow-lg"
          )}
        >
          <p className="min-w-0 truncate text-sm text-zinc-300">
            {undo.kind === "split"
              ? `Split ${undo.transaction.merchant_name ?? "transaction"}`
              : `${CATEGORY_LABELS[undo.category!]} · ${undo.transaction.merchant_name ?? "Transaction"}`}
          </p>
          <button
            type="button"
            onClick={handleUndo}
            className="shrink-0 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
