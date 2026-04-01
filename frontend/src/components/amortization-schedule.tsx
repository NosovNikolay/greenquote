"use client";

import type {
  AmortizationScheduleResponse,
  InstallmentOffer,
} from "@/lib/api/types";
import { api } from "@/lib/api/client";
import { useEffect, useState } from "react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

export function AmortizationSchedule({
  quoteId,
  offer,
}: {
  quoteId: string;
  offer: InstallmentOffer | undefined;
}) {
  const [data, setData] = useState<AmortizationScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const termYears = offer?.termYears;
  const principalOk =
    offer != null && offer.principalEur > 0 && termYears != null;

  useEffect(() => {
    if (!principalOk || termYears == null) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await api.getQuoteAmortization(quoteId, termYears);
        if (cancelled) return;
        setData(res);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load schedule");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [quoteId, termYears, principalOk]);

  if (!offer || offer.principalEur <= 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        No financed amount — amortization does not apply.
      </p>
    );
  }

  const initialLoad = loading && data == null;

  if (initialLoad) {
    return (
      <div
        className="flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--card-border)] bg-[#fafcfb] px-4 py-8"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent"
          aria-hidden
        />
        <p className="text-sm text-[var(--muted)]">Loading amortization…</p>
      </div>
    );
  }

  if (error && data == null) {
    return (
      <p className="text-sm text-[var(--danger)]" role="alert">
        {error}
      </p>
    );
  }

  if (!data?.rows.length) {
    return (
      <p className="text-sm text-[var(--muted)]">
        No schedule rows returned.
      </p>
    );
  }

  const displayMatchesSelection = data.termYears === termYears;
  const rows = data.rows;
  const refreshing = loading && data != null;

  return (
    <div className="space-y-3">
      {error && data != null ? (
        <p className="text-sm text-amber-800" role="status">
          {error} (showing last loaded schedule.)
        </p>
      ) : null}

      <div
        className={`relative space-y-3 transition-opacity duration-150 ${
          refreshing || !displayMatchesSelection ? "opacity-60" : "opacity-100"
        }`}
      >
        {refreshing ? (
          <div
            className="pointer-events-none absolute right-2 top-0 z-[2] flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-white/95 px-3 py-1.5 text-xs text-[var(--muted)] shadow-sm backdrop-blur-sm"
            role="status"
            aria-live="polite"
          >
            <span
              className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent"
              aria-hidden
            />
            Updating schedule…
          </div>
        ) : null}

        <p className="text-xs text-[var(--muted)]">
          Financed {formatCurrency(data.principalEur)} at {data.apr}% APR over{" "}
          {data.termYears} years ({rows.length} payments).
        </p>
        <div className="max-h-[min(24rem,50vh)] overflow-auto rounded-[var(--radius-md)] border border-[var(--card-border)]">
          <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-[1] bg-[#f4f7f5] text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2 text-right">Payment</th>
                <th className="px-3 py-2 text-right">Principal</th>
                <th className="px-3 py-2 text-right">Interest</th>
                <th className="px-3 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.month}
                  className="border-t border-[var(--card-border)] odd:bg-white even:bg-[#fafcfb]"
                >
                  <td className="px-3 py-1.5 tabular-nums text-[var(--muted)]">
                    {r.month}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {formatCurrency(r.payment)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {formatCurrency(r.principal)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {formatCurrency(r.interest)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {formatCurrency(r.balanceRemaining)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-[var(--foreground)]">
          Total interest over the term:{" "}
          <span className="font-semibold tabular-nums">
            {formatCurrency(data.totalInterestEur)}
          </span>
        </p>
      </div>
    </div>
  );
}
