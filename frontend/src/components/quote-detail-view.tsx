"use client";

import { AmortizationSchedule } from "@/components/amortization-schedule";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { QuoteMinimap } from "@/components/quote-minimap";
import { cn } from "@/lib/utils";
import { downloadQuotePdf } from "@/lib/quote-pdf";
import { api } from "@/lib/api/client";
import type { QuoteDetail } from "@/lib/api/types";
import Link from "next/link";
import { useParams } from "next/navigation";
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
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

function bandMeta(band: string): { label: string; hint: string } {
  switch (band) {
    case "A":
      return {
        label: "Band A",
        hint: "Strong credit profile for this scenario.",
      };
    case "B":
      return {
        label: "Band B",
        hint: "Standard profile — terms may vary slightly.",
      };
    default:
      return {
        label: `Band ${band}`,
        hint: "Elevated risk band — review details before proceeding.",
      };
  }
}

function bandClass(band: string) {
  switch (band) {
    case "A":
      return "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white text-emerald-950";
    case "B":
      return "border-amber-200 bg-gradient-to-br from-amber-50 to-white text-amber-950";
    default:
      return "border-orange-200 bg-gradient-to-br from-orange-50 to-white text-orange-950";
  }
}

export function QuoteDetailView() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [detail, setDetail] = useState<QuoteDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTermYears, setSelectedTermYears] = useState<
    5 | 10 | 15 | null
  >(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getQuote(id);
        if (!cancelled) setDetail(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Could not load quote");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    setSelectedTermYears(null);
  }, [detail?.id]);

  const activeTermYears = useMemo(() => {
    if (!detail?.installmentOffers?.length) return null;
    if (
      selectedTermYears != null &&
      detail.installmentOffers.some((o) => o.termYears === selectedTermYears)
    ) {
      return selectedTermYears;
    }
    return detail.installmentOffers[0]!.termYears;
  }, [detail, selectedTermYears]);

  const selectedOffer = useMemo(() => {
    if (!detail || activeTermYears == null) return undefined;
    return detail.installmentOffers.find((o) => o.termYears === activeTermYears);
  }, [detail, activeTermYears]);

  if (error) {
    return (
      <Card>
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
        <Link
          href="/quotes"
          className={cn(
            "mt-4 inline-flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--card-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--primary)] shadow-sm hover:bg-[var(--accent-soft)]",
          )}
        >
          Back to quotes
        </Link>
      </Card>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-8 text-center text-sm text-[var(--muted)]">
        Loading quote…
      </div>
    );
  }

  const meta = bandMeta(detail.riskBand);

  return (
    <div className="space-y-8">
      <div
        className={cn(
          "rounded-[var(--radius-lg)] border-2 p-6 shadow-[var(--shadow-soft)] sm:p-8",
          bandClass(detail.riskBand),
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Evaluation class
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-4xl font-bold tracking-tight sm:text-5xl">
              {meta.label}
            </p>
            <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
              {meta.hint}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Indicative system price
            </p>
            <p className="text-2xl font-semibold tabular-nums sm:text-3xl">
              {formatCurrency(detail.systemPrice)}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-black/5 pt-6">
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            onClick={() => downloadQuotePdf(detail)}
          >
            Download PDF
          </Button>
          <Link
            href="/quotes"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--card-border)] bg-white px-4 text-sm font-medium text-[var(--primary)] shadow-sm hover:bg-[var(--accent-soft)]"
          >
            All quotes
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">Project &amp; contact</CardTitle>
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Quote reference
              </dt>
              <dd className="mt-1 font-mono text-sm">{detail.id}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Created
              </dt>
              <dd className="mt-1">{formatDate(detail.createdAt)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Installation address
              </dt>
              {detail.streetLine &&
              detail.city &&
              detail.country ? (
                <dd className="mt-2 space-y-1.5">
                  <p>
                    <span className="text-[var(--muted)]">Street: </span>
                    <span className="font-medium">{detail.streetLine}</span>
                  </p>
                  <p>
                    <span className="text-[var(--muted)]">City: </span>
                    <span className="font-medium">{detail.city}</span>
                  </p>
                  <p>
                    <span className="text-[var(--muted)]">Country: </span>
                    <span className="font-medium">{detail.country}</span>
                  </p>
                </dd>
              ) : (
                <dd className="mt-1 font-medium">{detail.address}</dd>
              )}
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Contact
              </dt>
              <dd className="mt-1">
                {detail.fullName} · {detail.email}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                  Monthly consumption
                </dt>
                <dd className="mt-1 tabular-nums">
                  {detail.monthlyConsumptionKwh} kWh
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                  System size
                </dt>
                <dd className="mt-1 tabular-nums">{detail.systemSizeKw} kW</dd>
              </div>
            </div>
            {detail.downPayment != null && detail.downPayment > 0 ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                  Down payment
                </dt>
                <dd className="mt-1 tabular-nums">
                  {formatCurrency(detail.downPayment)}
                </dd>
              </div>
            ) : null}
          </dl>
        </Card>

        <Card>
          <CardTitle className="mb-4">Location</CardTitle>
          <QuoteMinimap
            address={detail.address}
            lat={detail.addressLat}
            lon={detail.addressLon}
          />
        </Card>
      </div>

      <Card>
        <CardTitle className="mb-4">Installment offers</CardTitle>
        <p className="mb-3 text-sm text-[var(--muted)]">
          Select a term to view the amortization schedule below.
        </p>
        <ul className="grid gap-2 sm:grid-cols-3">
          {detail.installmentOffers.map((o) => (
            <li key={o.termYears}>
              <button
                type="button"
                onClick={() => setSelectedTermYears(o.termYears)}
                className={cn(
                  "flex w-full flex-col rounded-[var(--radius-md)] border px-4 py-3 text-left text-sm transition-colors",
                  activeTermYears === o.termYears
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]"
                    : "border-[var(--card-border)] bg-[#fafcfb] hover:bg-[#f0f4f2]",
                )}
              >
                <span className="text-[var(--muted)]">{o.termYears} years</span>
                <span className="mt-1 text-lg font-semibold tabular-nums">
                  {formatCurrency(o.monthlyPayment)}
                  <span className="ml-1 text-xs font-normal text-[var(--muted)]">
                    /mo
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-[var(--muted)]">
          Figures are indicative and not a binding financing offer.
        </p>
      </Card>

      <Card>
        <CardTitle className="mb-2">Amortization schedule</CardTitle>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Month-by-month breakdown of each payment into principal and interest,
          and the remaining loan balance (fixed-rate loan, annuity method).
        </p>
        <AmortizationSchedule offer={selectedOffer} />
      </Card>
    </div>
  );
}
