"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const remaining = total - current;
  const pct = total > 0 ? ((total - remaining) / total) * 100 : 100;

  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-500">Progress</span>
        <span className="font-medium tabular-nums text-zinc-400">
          {current}/{total}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn(
            "h-full rounded-full bg-emerald-500/70 transition-all duration-500 ease-out"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
