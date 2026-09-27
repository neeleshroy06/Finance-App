import { SettingsScreen } from "@/components/settings-screen";

export default function SettingsPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-500">Bank & merchant rules</p>
      </header>
      <SettingsScreen />
    </>
  );
}
