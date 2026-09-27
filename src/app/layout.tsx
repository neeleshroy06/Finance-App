import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NavBar } from "@/components/nav-bar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
      <body className={`${inter.variable} min-h-screen bg-zinc-950 text-zinc-100`}>
        <main className="mx-auto min-h-screen max-w-lg px-4 pb-24 pt-8">
          {children}
        </main>
        <NavBar />
      </body>
    </html>
  );
}
