"use client";

import type { InstallmentOffer } from "@/lib/api/types";
import {
  buildAmortizationSchedule,
  totalInterestPaid,
} from "@/lib/amortization";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

export function AmortizationSchedule({
  offer,
}: {
  offer: InstallmentOffer | undefined;
}) {
  if (!offer || offer.principalUsd <= 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        No financed amount — amortization does not apply.
      </p>
    );
  }

  const rows = buildAmortizationSchedule({
    principalUsd: offer.principalUsd,
    annualAprPercent: offer.apr,
    termYears: offer.termYears,
    monthlyPaymentUsd: offer.monthlyPayment,
  });

  const interestTotal = totalInterestPaid(rows);

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--muted)]">
        Financed {formatCurrency(offer.principalUsd)} at {offer.apr}% APR over{" "}
        {offer.termYears} years ({rows.length} payments).
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
          {formatCurrency(interestTotal)}
        </span>
      </p>
    </div>
  );
}
