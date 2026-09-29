import { NextRequest, NextResponse } from "next/server";
import { fakeStore } from "@/lib/fake-data";
import { createClient } from "@/lib/supabase/server";
import { isFakeDataMode } from "@/lib/config";
import { amountsMatch } from "@/lib/splits";
import { Category, SplitInput } from "@/lib/types";

function validateSplits(splits: SplitInput[]): string | null {
  if (!Array.isArray(splits) || splits.length < 2) {
    return "At least 2 splits are required";
  }

  for (const split of splits) {
    if (!split.category || !["food", "other", "friend", "extra", "refund", "skip"].includes(split.category)) {
      return "Invalid category in split";
    }
    if (!split.amount || split.amount <= 0) {
      return "Each split amount must be greater than 0";
    }
  }

  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const splits = body.splits as SplitInput[];

  const validationError = validateSplits(splits);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  if (isFakeDataMode()) {
    const result = fakeStore.split(id, splits);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("transactions")
    .select("merchant_name, amount, category")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!amountsMatch(Number(existing.amount), splits)) {
    return NextResponse.json(
      { error: "Split amounts must equal the transaction total" },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("transactions")
    .update({ category: "split" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from("transaction_splits")
    .delete()
    .eq("transaction_id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const splitRows = splits.map((s) => ({
    transaction_id: id,
    user_id: user.id,
    category: s.category,
    amount: s.amount,
  }));

  const { data: insertedSplits, error: splitError } = await supabase
    .from("transaction_splits")
    .insert(splitRows)
    .select();

  if (splitError) {
    await supabase
      .from("transactions")
      .update({ category: null })
      .eq("id", id)
      .eq("user_id", user.id);
    return NextResponse.json({ error: splitError.message }, { status: 500 });
  }

  const { data: transaction } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  let suggest_rule: { merchant_name: string; category: Category } | null = null;
  const isEdit = existing.category === "split";

  if (!isEdit && existing.merchant_name) {
    const { data: rule } = await supabase
      .from("merchant_rules")
      .select("merchant_name")
      .eq("user_id", user.id)
      .eq("merchant_name", existing.merchant_name)
      .maybeSingle();

    if (!rule) {
      const primaryCategory =
        splits.find((s) => s.category !== "skip")?.category ?? splits[0].category;
      suggest_rule = {
        merchant_name: existing.merchant_name,
        category: primaryCategory,
      };
    }
  }

  return NextResponse.json({
    transaction: { ...transaction, splits: insertedSplits },
    suggest_rule,
  });
}
