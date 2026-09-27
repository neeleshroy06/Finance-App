import { SupabaseClient } from "@supabase/supabase-js";
import { getPlaidClient } from "@/lib/plaid";

interface PlaidItem {
  id: string;
  user_id: string;
  access_token: string;
  cursor: string | null;
}

export async function syncTransactionsForItems(
  supabase: SupabaseClient,
  items: PlaidItem[]
) {
  const plaid = getPlaidClient();
  let synced = 0;

  for (const item of items) {
    let cursor = item.cursor ?? undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await plaid.transactionsSync({
        access_token: item.access_token,
        cursor,
      });

      const { added, modified, removed, next_cursor, has_more } =
        response.data;

      // Upsert on plaid_transaction_id — handles Plaid dedup/updates natively.
      // category is omitted so existing categorizations are never overwritten.
      for (const tx of added) {
        const { error } = await supabase.from("transactions").upsert(
          {
            user_id: item.user_id,
            plaid_transaction_id: tx.transaction_id,
            merchant_name: tx.merchant_name ?? tx.name,
            amount: tx.amount,
            date: tx.date,
          },
          { onConflict: "plaid_transaction_id" }
        );
        if (!error) synced++;
      }

      for (const tx of modified) {
        const { error } = await supabase
          .from("transactions")
          .update({
            merchant_name: tx.merchant_name ?? tx.name,
            amount: tx.amount,
            date: tx.date,
          })
          .eq("plaid_transaction_id", tx.transaction_id);
        if (!error) synced++;
      }

      for (const removedTx of removed) {
        await supabase
          .from("transactions")
          .delete()
          .eq("plaid_transaction_id", removedTx.transaction_id);
      }

      cursor = next_cursor;
      hasMore = has_more;
    }

    await supabase
      .from("plaid_items")
      .update({ cursor, updated_at: new Date().toISOString() })
      .eq("id", item.id);
  }

  return synced;
}
