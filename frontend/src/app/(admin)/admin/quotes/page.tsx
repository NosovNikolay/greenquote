import { AdminQuotesPanel } from "@/components/admin-quotes-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All quotes",
  description: "View and filter all pre-qualification quotes.",
};

export default function AdminQuotesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--primary)]">
          Quotes
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          All quotes across users. Filter by name or email. Access is enforced on
          the server.
        </p>
      </header>
      <AdminQuotesPanel />
    </div>
  );
}
