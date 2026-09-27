import { ReviewScreen } from "@/components/review-screen";

export default function ReviewPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-300">Review</h1>
        <p className="text-sm text-zinc-600">Tap a category for each charge</p>
      </header>
      <ReviewScreen />
    </>
  );
}
