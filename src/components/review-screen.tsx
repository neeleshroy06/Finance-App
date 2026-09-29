"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { TransactionRow } from "@/components/transaction-row";
import { EmptyReviewState } from "@/components/empty-review-state";
import { ProgressBar } from "@/components/progress-bar";
import { RulePrompt } from "@/components/rule-prompt";
import { Button } from "@/components/ui/button";
import { Category, SplitInput, Transaction } from "@/lib/types";

const BATCH_SIZE = 10;

interface PendingRule {
  merchant_name: string;
  category: Category;
}

export function ReviewScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"sign_in" | "load_failed" | null>(null);
  const [pendingRule, setPendingRule] = useState<PendingRule | null>(null);
  const initialTotal = useRef(0);

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

  const handleCategorize = (id: string, category: Category) => {
    removeTransaction(id);

    fetch(`/api/transactions/${id}/categorize`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.suggest_rule) {
          setPendingRule(data.suggest_rule);
        }
      })
      .catch(console.error);
  };

  const handleSplit = (id: string, splits: SplitInput[]) => {
    removeTransaction(id);

    fetch(`/api/transactions/${id}/split`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ splits }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.suggest_rule) {
          setPendingRule(data.suggest_rule);
        }
      })
      .catch(console.error);
  };

  const confirmRule = async () => {
    if (!pendingRule) return;
    await fetch("/api/merchant-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pendingRule),
    });
    setPendingRule(null);
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

  if (remaining === 0) {
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

      {pendingRule && (
        <RulePrompt
          merchantName={pendingRule.merchant_name}
          category={pendingRule.category}
          onConfirm={confirmRule}
          onDismiss={() => setPendingRule(null)}
        />
      )}
    </div>
  );
}
