import { NextResponse } from "next/server";
import { fakeStore } from "@/lib/fake-data";
import { createClient } from "@/lib/supabase/server";
import { isFakeDataMode } from "@/lib/config";
import { Transaction, TransactionSplit } from "@/lib/types";

function attachSplits(
  transactions: Transaction[],
  splits: TransactionSplit[]
): Transaction[] {
  const byTx = splits.reduce(
    (acc, split) => {
      if (!acc[split.transaction_id]) acc[split.transaction_id] = [];
      acc[split.transaction_id].push(split);
      return acc;
    },
    {} as Record<string, TransactionSplit[]>
  );

  return transactions.map((tx) =>
    byTx[tx.id] ? { ...tx, splits: byTx[tx.id] } : tx
  );
}

export async function GET() {
  if (isFakeDataMode()) {
    return NextResponse.json({ transactions: fakeStore.getCategorized() });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .not("category", "is", null)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const transactions = (data ?? []) as Transaction[];
  const splitTxIds = transactions
    .filter((t) => t.category === "split")
    .map((t) => t.id);

  if (splitTxIds.length === 0) {
    return NextResponse.json({ transactions });
  }

  const { data: splits, error: splitError } = await supabase
    .from("transaction_splits")
    .select("*")
    .eq("user_id", user.id)
    .in("transaction_id", splitTxIds);

  if (splitError) {
    return NextResponse.json({ error: splitError.message }, { status: 500 });
  }

  return NextResponse.json({
    transactions: attachSplits(transactions, (splits ?? []) as TransactionSplit[]),
  });
}
