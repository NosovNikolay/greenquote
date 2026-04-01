import { QuotesTable } from "@/components/quotes-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My quotes",
  description: "Your solar pre-qualification quotes.",
};

export default function QuotesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--primary)]">
          My quotes
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Quotes you requested while signed in as this user.
        </p>
      </header>
      <QuotesTable />
    </div>
  );
}
