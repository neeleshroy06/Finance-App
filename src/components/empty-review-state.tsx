"use client";

import { Check } from "lucide-react";

export function EmptyReviewState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="animate-check-pop mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
        <Check className="h-10 w-10 text-emerald-400" strokeWidth={2.5} />
      </div>
      <h2 className="mb-2 text-2xl font-semibold text-zinc-100">All caught up</h2>
      <p className="max-w-xs text-zinc-500">
        Nothing to review right now. Check totals to see where your money went.
      </p>
    </div>
  );
}
