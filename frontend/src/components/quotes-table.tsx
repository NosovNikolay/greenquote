"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { riskBandBadgeClass } from "@/lib/risk-band-badge";
import type { MyQuotesListResponse, QuoteSummary } from "@/lib/api/types";
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

const PAGE_SIZE = 30;

export function QuotesTable() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MyQuotesListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.listMyQuotes(page, PAGE_SIZE);
        if (cancelled) return;
        if (res.total > 0 && res.items.length === 0 && page > 1) {
          setPage(1);
          return;
        }
        setData(res);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load quotes");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const rows: QuoteSummary[] | null = data?.items ?? null;

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
          href="/new"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] px-8 text-sm font-medium text-white shadow-sm hover:bg-[var(--primary-hover)]"
        >
          Create quote
        </Link>
      </div>
    );
  }

  const totalPages =
    data != null && data.limit > 0
      ? Math.max(1, Math.ceil(data.total / data.limit))
      : 1;
  const rangeStart =
    data != null && data.total > 0 ? (data.page - 1) * data.limit + 1 : 0;
  const rangeEnd =
    data != null ? Math.min(data.page * data.limit, data.total) : 0;
  const atSinglePage = totalPages <= 1;

  return (
    <div className="space-y-4">
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--muted)]">
          {data != null && data.total > 0 ? (
            <>
              Showing{" "}
              <span className="tabular-nums text-[var(--foreground)]">
                {rangeStart}–{rangeEnd}
              </span>{" "}
              of{" "}
              <span className="tabular-nums text-[var(--foreground)]">
                {data.total}
              </span>
            </>
          ) : null}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="min-w-[5.5rem]"
            disabled={atSinglePage || page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm tabular-nums text-[var(--muted)]">
            Page {data?.page ?? page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            className="min-w-[5.5rem]"
            disabled={atSinglePage || page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
