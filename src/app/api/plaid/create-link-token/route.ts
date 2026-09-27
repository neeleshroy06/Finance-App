import { NextResponse } from "next/server";
import { Products, CountryCode } from "plaid";
import { createClient } from "@/lib/supabase/server";
import { getPlaidClient } from "@/lib/plaid";

export async function POST() {
  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    return NextResponse.json(
      { error: "Plaid credentials not configured" },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plaid = getPlaidClient();
  const response = await plaid.linkTokenCreate({
    user: { client_user_id: user.id },
    client_name: "Transaction Categorizer",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
  });

  return NextResponse.json({ link_token: response.data.link_token });
}
