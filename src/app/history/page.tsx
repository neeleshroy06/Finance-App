import { HistoryScreen } from "@/components/history-screen";
import { Suspense } from "react";

export default function HistoryPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">History</h1>
        <p className="text-sm text-zinc-500">Tap a row to change its category</p>
      </header>
      <Suspense fallback={null}>
        <HistoryScreen />
      </Suspense>
    </>
  );
}
