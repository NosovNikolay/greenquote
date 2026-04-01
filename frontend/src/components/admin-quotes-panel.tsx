"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import type { AdminQuoteRow } from "@/lib/api/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  const [rows, setRows] = useState<AdminQuoteRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const queryKey = useMemo(() => debounced, [debounced]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.listAdminQuotes(queryKey || undefined);
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load quotes");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryKey]);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="admin-filter">Filter by name or email</Label>
          <Input
            id="admin-filter"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            autoComplete="off"
            aria-describedby="admin-filter-hint"
          />
          <p id="admin-filter-hint" className="text-xs text-[var(--muted)]">
            Results update as you type (debounced).
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setQ("")}
          className="shrink-0"
        >
          Clear
        </Button>
      </div>

      {rows === null ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-8 text-center text-sm text-[var(--muted)]">
          Loading all quotes…
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No quotes match this filter.</p>
      ) : (
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
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--accent-soft)]/40">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="max-w-[200px] px-4 py-3">
                    <span className="block truncate font-medium">{r.userName}</span>
                    <span className="block truncate text-xs text-[var(--muted)]">
                      {r.userEmail}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.systemSizeKw}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatCurrency(r.systemPrice)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--primary)]">
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
      )}
    </div>
  );
}
