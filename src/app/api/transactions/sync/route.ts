import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { syncTransactionsForItems } from "@/lib/sync-transactions";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    return NextResponse.json(
      { error: "Plaid not configured" },
      { status: 500 }
    );
  }

  const supabase = createServiceClient();

  const { data: items, error } = await supabase.from("plaid_items").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const synced = await syncTransactionsForItems(supabase, items ?? []);

  return NextResponse.json({ ok: true, synced, items: items?.length ?? 0 });
}
