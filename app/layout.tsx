import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: "MeetBrief — Ayra",
  description:
    "One-page pre-meeting briefings for the last 30 days. News, launches, hires, source URLs, discussion points, and unverified claims — researched with Tavily.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} font-sans antialiased`}>
        <header className="no-print border-b border-pine-deep bg-pine text-sheet">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="group flex items-baseline gap-2">
              <span className="font-serif text-2xl tracking-tight">MeetBrief</span>
              <span className="text-xs uppercase tracking-[0.18em] text-sheet/70">Ayra</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm text-sheet/85">
              <Link href="/demo" className="hover:text-white">
                Sample
              </Link>
              <Link href="/#prepare" className="hover:text-white">
                Prepare
              </Link>
            </nav>
          </div>
          <div className="h-1 bg-saffron" />
        </header>
        {children}
        <footer className="no-print mx-auto max-w-6xl px-4 py-10 text-sm text-muted">
          <p>
            Geek Room Global AI Hackathon · PS5 Tavily Research Agent · team ayra agents · MIT
          </p>
        </footer>
      </body>
    </html>
  );
}
