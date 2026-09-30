import { NextRequest, NextResponse } from "next/server";
import { fakeStore } from "@/lib/fake-data";
import { createClient } from "@/lib/supabase/server";
import { isFakeDataMode } from "@/lib/config";
import { Category } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const category = body.category as Category;

  if (!category || !["food", "other", "friend", "extra", "refund", "skip"].includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (isFakeDataMode()) {
    const tx = fakeStore.updateCategory(id, category);
    if (!tx) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ transaction: tx });
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
    .update({ category })
    .eq("id", id)
    .eq("user_id", user.id)
    .not("category", "is", null)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error: splitError } = await supabase
    .from("transaction_splits")
    .delete()
    .eq("transaction_id", id)
    .eq("user_id", user.id);

  if (splitError) {
    return NextResponse.json({ error: splitError.message }, { status: 500 });
  }

  return NextResponse.json({ transaction: data });
}
