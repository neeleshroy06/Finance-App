import { NextRequest, NextResponse } from "next/server";
import { fakeStore } from "@/lib/fake-data";
import { createClient } from "@/lib/supabase/server";
import { isFakeDataMode } from "@/lib/config";
import { Category } from "@/lib/types";

export async function GET() {
  if (isFakeDataMode()) {
    return NextResponse.json({ rules: fakeStore.getRules() });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("merchant_rules")
    .select("*")
    .eq("user_id", user.id)
    .order("merchant_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rules: data ?? [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { merchant_name, category } = body as {
    merchant_name: string;
    category: Category;
  };

  if (!merchant_name || !category) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (isFakeDataMode()) {
    fakeStore.createRule(merchant_name, category);
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("merchant_rules").upsert(
    {
      user_id: user.id,
      merchant_name,
      category,
    },
    { onConflict: "user_id,merchant_name" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { merchant_name } = body as { merchant_name: string };

  if (isFakeDataMode()) {
    fakeStore.deleteRule(merchant_name);
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("merchant_rules")
    .delete()
    .eq("user_id", user.id)
    .eq("merchant_name", merchant_name);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
