"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import { riskBandBadgeClass } from "@/lib/risk-band-badge";
import type { AdminQuotesListResponse } from "@/lib/api/types";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";

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

export function AdminQuotesPanel() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminQuotesListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const queryKey = useMemo(() => debounced, [debounced]);

  useLayoutEffect(() => {
    setPage(1);
  }, [queryKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.listAdminQuotes(queryKey || undefined, page);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load quotes");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryKey, page]);

  const totalPages =
    data != null && data.limit > 0
      ? Math.max(1, Math.ceil(data.total / data.limit))
      : 1;
  const rangeStart =
    data != null && data.total > 0 ? (data.page - 1) * data.limit + 1 : 0;
  const rangeEnd =
    data != null ? Math.min(data.page * data.limit, data.total) : 0;

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

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="admin-filter">Filter by name or email</Label>
        <Input
          id="admin-filter"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          autoComplete="off"
          aria-describedby="admin-filter-hint"
          className="max-w-md"
        />
        <p id="admin-filter-hint" className="text-xs text-[var(--muted)]">
          Results update as you type (debounced). Up to 30 quotes per page.
        </p>
      </div>

      {data === null ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-8 text-center text-sm text-[var(--muted)]">
          Loading quotes…
        </div>
      ) : data.items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No quotes match this filter.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white shadow-[var(--shadow-soft)]">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">All quotes (admin)</caption>
              <thead className="border-b border-[var(--card-border)] bg-[#fafcfb] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3">
                    User
                  </th>
                  <th scope="col" className="px-4 py-3">
                    System (kW)
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Band
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {data.items.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--accent-soft)]/40">
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <span className="block truncate font-medium">
                        {r.userName}
                      </span>
                      <span className="block truncate text-xs text-[var(--muted)]">
                        {r.userEmail}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{r.systemSizeKw}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatCurrency(r.systemPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${riskBandBadgeClass(r.riskBand)}`}
                      >
                        {r.riskBand}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/quotes/${r.id}`}
                        className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
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
              {data.total > 0 ? (
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
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm tabular-nums text-[var(--muted)]">
                Page {data.page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                className="min-w-[5.5rem]"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
