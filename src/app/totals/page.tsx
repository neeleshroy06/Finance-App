import { TotalsScreen } from "@/components/totals-screen";

export default function TotalsPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">Totals</h1>
        <p className="text-sm text-zinc-500">Where your money went</p>
      </header>
      <TotalsScreen />
    </>
  );
}
