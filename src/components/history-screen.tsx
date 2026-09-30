"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HistoryRow } from "@/components/history-row";
import { Category, SplitInput, Transaction, TransactionSplit } from "@/lib/types";

export function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions/history");
      const data = await res.json();
      setTransactions(data.transactions ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const transactionId = searchParams.get("transaction");
    if (transactionId && transactions.some((transaction) => transaction.id === transactionId)) {
      setEditingId(transactionId);
    }
  }, [searchParams, transactions]);

  const handleTap = (id: string) => {
    setEditingId((prev) => (prev === id ? null : id));
  };

  const handleCategoryChange = async (id: string, category: Category) => {
    const previous = transactions;
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, category, splits: undefined } : t))
    );
    setEditingId(null);

    const res = await fetch(`/api/transactions/${id}/category`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    if (!res.ok) {
      setTransactions(previous);
      setEditingId(id);
    }
  };

  const handleSplitChange = (id: string, splits: SplitInput[]) => {
    const newSplits: TransactionSplit[] = splits.map((s, i) => ({
      id: `temp-${i}`,
      transaction_id: id,
      category: s.category,
      amount: s.amount,
    }));

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, category: "split", splits: newSplits } : t
      )
    );
    setEditingId(null);

    fetch(`/api/transactions/${id}/split`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ splits }),
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok) {
          setEditingId(id);
          return;
        }
        if (data.transaction?.splits) {
          setTransactions((prev) =>
            prev.map((t) => (t.id === id ? data.transaction : t))
          );
        }
      })
      .catch(console.error);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <p className="py-20 text-center text-sm text-zinc-500">
        No categorized transactions yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <HistoryRow
          key={tx.id}
          transaction={tx}
          isEditing={editingId === tx.id}
          onTap={() => handleTap(tx.id)}
          onCategoryChange={handleCategoryChange}
          onSplitChange={handleSplitChange}
        />
      ))}
    </div>
  );
}
