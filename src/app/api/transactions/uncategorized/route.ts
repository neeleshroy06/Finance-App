import { NextRequest, NextResponse } from "next/server";
import { fakeStore } from "@/lib/fake-data";
import { createClient } from "@/lib/supabase/server";
import { isFakeDataMode } from "@/lib/config";
import { Transaction } from "@/lib/types";

async function enrichWithSuggestions(
  transactions: Transaction[],
  userId: string
): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data: rules } = await supabase
    .from("merchant_rules")
    .select("merchant_name, category")
    .eq("user_id", userId);

  if (!rules?.length) return transactions;

  return transactions.map((tx) => {
    if (tx.category !== null) return tx;
    const rule = rules.find(
      (r) =>
        r.merchant_name.toLowerCase() === (tx.merchant_name ?? "").toLowerCase()
    );
    return rule ? { ...tx, suggested_category: rule.category } : tx;
  });
}

export async function GET() {
  if (isFakeDataMode()) {
    return NextResponse.json({ transactions: fakeStore.getUncategorized() });
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
    .is("category", null)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enriched = await enrichWithSuggestions(
    (data ?? []) as Transaction[],
    user.id
  );

  return NextResponse.json({ transactions: enriched });
}
