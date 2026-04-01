import { QuoteDetailView } from "@/components/quote-detail-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quote details",
};

export default function QuoteDetailPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-[var(--primary)]">
        Quote details
      </h1>
      <QuoteDetailView />
    </div>
  );
}
