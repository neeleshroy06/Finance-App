"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, CATEGORY_LABELS, Category, MerchantRule } from "@/lib/types";
import { usePlaidLink } from "react-plaid-link";
import { Link2, Plus, Trash2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export function SettingsScreen() {
  const [rules, setRules] = useState<MerchantRule[]>([]);
  const [plaidConnected, setPlaidConnected] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState("");
  const [merchantCategory, setMerchantCategory] = useState<Category>("food");
  const [ruleError, setRuleError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchLinkToken = useCallback(async () => {
    const res = await fetch("/api/plaid/create-link-token", { method: "POST" });
    const data = await res.json();
    if (data.link_token) {
      setLinkToken(data.link_token);
      setLinkError(null);
    } else if (data.error) {
      setLinkError(data.error);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, statusRes] = await Promise.all([
        fetch("/api/merchant-rules"),
        fetch("/api/plaid/status"),
      ]);
      const rulesData = await rulesRes.json();
      const statusData = await statusRes.json();
      setRules(rulesData.rules ?? []);
      setPlaidConnected(statusData.connected ?? false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const client = createClient();

    client.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user) fetchLinkToken();
  }, [user, fetchLinkToken]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      const res = await fetch("/api/plaid/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token: publicToken }),
      });
      if (res.ok) {
        setPlaidConnected(true);
        fetchLinkToken();
      }
    },
  });

  const handleConnect = () => {
    if (ready && linkToken) {
      open();
    } else {
      fetchLinkToken();
    }
  };

  const handleSignIn = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  const deleteRule = async (merchantName: string) => {
    await fetch("/api/merchant-rules", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant_name: merchantName }),
    });
    setRules((prev) => prev.filter((r) => r.merchant_name !== merchantName));
  };

  const saveRule = async () => {
    const name = merchantName.trim();
    if (!name) return;
    setRuleError(null);
    const res = await fetch("/api/merchant-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant_name: name, category: merchantCategory }),
    });
    if (!res.ok) {
      setRuleError("Could not save this rule.");
      return;
    }
    setRules((prev) => [
      ...prev.filter((rule) => rule.merchant_name.toLowerCase() !== name.toLowerCase()),
      { user_id: "", merchant_name: name, category: merchantCategory },
    ].sort((a, b) => a.merchant_name.localeCompare(b.merchant_name)));
    setMerchantName("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Bank connection
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                Sign in to connect your bank via Plaid.
              </p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
              />
              {authError && (
                <p className="text-xs text-red-400">{authError}</p>
              )}
              <Button
                onClick={handleSignIn}
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-white"
              >
                Sign in
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    plaidConnected ? "bg-emerald-400" : "bg-zinc-600"
                  )}
                />
                <span className="text-sm text-zinc-300">
                  {plaidConnected ? "Connected" : "Not connected"}
                </span>
              </div>
              <Button
                onClick={handleConnect}
                disabled={!linkToken && !linkError}
                variant="outline"
                className="w-full border-zinc-700 bg-zinc-800/50 text-zinc-100 hover:bg-zinc-800"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Connect Bank
              </Button>
              {linkError && (
                <p className="mt-2 text-xs text-red-400">{linkError}</p>
              )}
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Merchant rules
        </h2>
        <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="mb-3 text-sm text-zinc-400">Choose which merchants should be categorized automatically.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="Merchant name"
              className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
            />
            <select
              value={merchantCategory}
              onChange={(e) => setMerchantCategory(e.target.value as Category)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
            >
              {CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}
            </select>
            <Button onClick={saveRule} disabled={!merchantName.trim()} className="bg-zinc-100 text-zinc-900 hover:bg-white">
              <Plus className="mr-2 h-4 w-4" />
              Add rule
            </Button>
          </div>
          {ruleError && <p className="mt-2 text-xs text-red-400">{ruleError}</p>}
        </div>
        {rules.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
            No merchant rules yet.
          </p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.merchant_name}
                className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1"
              >
                <button
                  type="button"
                  onClick={() => { setMerchantName(rule.merchant_name); setMerchantCategory(rule.category); }}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg p-2 text-left hover:bg-zinc-800/60"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                    {rule.merchant_name}
                  </span>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {CATEGORY_LABELS[rule.category]}
                  </span>
                </button>
                <button
                  onClick={() => deleteRule(rule.merchant_name)}
                  className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
                  aria-label={`Delete rule for ${rule.merchant_name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
