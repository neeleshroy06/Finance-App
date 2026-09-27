export function isFakeDataMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_FAKE_DATA === "true";
}
