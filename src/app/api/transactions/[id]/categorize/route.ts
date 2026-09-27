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

  if (!category || !["food", "other", "friend", "skip"].includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (isFakeDataMode()) {
    const result = fakeStore.categorize(id, category);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    .select("merchant_name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const { data, error } = await supabase
    .from("transactions")
    .update({ category })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let suggest_rule: { merchant_name: string; category: Category } | null = null;

  if (existing?.merchant_name) {
    const { data: rule } = await supabase
      .from("merchant_rules")
      .select("merchant_name")
      .eq("user_id", user.id)
      .eq("merchant_name", existing.merchant_name)
      .maybeSingle();

    if (!rule) {
      suggest_rule = {
        merchant_name: existing.merchant_name,
        category,
      };
    }
  }

  return NextResponse.json({ transaction: data, suggest_rule });
}
