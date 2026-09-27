"use client";

import { Button } from "@/components/ui/button";
import { Category, CATEGORY_LABELS } from "@/lib/types";

interface RulePromptProps {
  merchantName: string;
  category: Category;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function RulePrompt({
  merchantName,
  category,
  onConfirm,
  onDismiss,
}: RulePromptProps) {
  return (
    <div className="fixed inset-x-0 bottom-20 z-40 mx-auto max-w-lg px-4 animate-fade-in">
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
        <p className="mb-3 text-sm text-zinc-200">
          Always categorize{" "}
          <span className="font-medium text-zinc-100">{merchantName}</span> as{" "}
          <span className="font-medium text-zinc-100">
            {CATEGORY_LABELS[category]}
          </span>
          ?
        </p>
        <div className="flex gap-2">
          <Button
            onClick={onConfirm}
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Yes
          </Button>
          <Button
            onClick={onDismiss}
            variant="ghost"
            className="text-zinc-400 hover:text-zinc-200"
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
