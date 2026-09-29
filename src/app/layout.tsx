import type { Metadata } from "next";
import { NavBar } from "@/components/nav-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Transaction Categorizer",
  description: "Review a day's charges in under 30 seconds",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <main className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <NavBar />
      </body>
    </html>
  );
}
