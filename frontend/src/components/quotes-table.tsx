"use client";

import { api } from "@/lib/api/client";
import { riskBandBadgeClass } from "@/lib/risk-band-badge";
import type { QuoteSummary } from "@/lib/api/types";
import Link from "next/link";
import { useEffect, useState } from "react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function QuotesTable() {
  const [rows, setRows] = useState<QuoteSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.listMyQuotes();
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load quotes");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
      >
        {error}
      </div>
    );
  }

  if (rows === null) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-8 text-center text-sm text-[var(--muted)]">
        Loading your quotes…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-10 text-center shadow-[var(--shadow-soft)]">
        <p className="text-sm text-[var(--muted)]">You don&apos;t have any quotes yet.</p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] px-8 text-sm font-medium text-white shadow-sm hover:bg-[var(--primary-hover)]"
        >
          Create quote
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white shadow-[var(--shadow-soft)]">
      <table className="min-w-[900px] w-full text-left text-sm">
        <caption className="sr-only">Your solar quotes</caption>
        <thead className="border-b border-[var(--card-border)] bg-[#fafcfb] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          <tr>
            <th scope="col" className="px-4 py-3">
              Name
            </th>
            <th scope="col" className="px-4 py-3">
              Email
            </th>
            <th scope="col" className="px-4 py-3">
              City
            </th>
            <th scope="col" className="px-4 py-3">
              System price
            </th>
            <th scope="col" className="px-4 py-3">
              System size
            </th>
            <th scope="col" className="px-4 py-3">
              Risk band
            </th>
            <th scope="col" className="px-4 py-3">
              Date
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--card-border)]">
          {rows.map((q) => (
            <tr key={q.id} className="hover:bg-[var(--accent-soft)]/40">
              <td className="max-w-[140px] px-4 py-3">
                <span className="font-medium text-[var(--foreground)]">
                  {q.userName?.trim() || "—"}
                </span>
              </td>
              <td className="max-w-[180px] px-4 py-3">
                <span className="break-all text-[var(--foreground)]">
                  {q.userEmail?.trim() || "—"}
                </span>
              </td>
              <td className="max-w-[120px] px-4 py-3 text-[var(--foreground)]">
                {q.city?.trim() || "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums font-medium">
                {formatCurrency(q.systemPrice)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                {q.systemSizeKw} kW
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${riskBandBadgeClass(q.riskBand)}`}
                >
                  {q.riskBand}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[var(--muted)]">
                {formatDate(q.createdAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <Link
                  href={`/quotes/${q.id}`}
                  className="inline-flex min-h-9 min-w-[4.5rem] items-center justify-center rounded-[var(--radius-md)] border border-[var(--card-border)] bg-white px-3 text-sm font-medium text-[var(--accent)] shadow-sm hover:bg-[var(--accent-soft)]"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
