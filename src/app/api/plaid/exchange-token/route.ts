import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlaidClient } from "@/lib/plaid";

export async function POST(request: NextRequest) {
  const { public_token } = await request.json();

  if (!public_token) {
    return NextResponse.json({ error: "Missing public_token" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plaid = getPlaidClient();
  const exchange = await plaid.itemPublicTokenExchange({ public_token });

  const { error } = await supabase.from("plaid_items").upsert(
    {
      user_id: user.id,
      access_token: exchange.data.access_token,
      item_id: exchange.data.item_id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
