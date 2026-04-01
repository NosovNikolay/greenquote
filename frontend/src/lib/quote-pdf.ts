import type { QuoteDetail } from "@/lib/api/types";
import { jsPDF } from "jspdf";

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

export function downloadQuotePdf(detail: QuoteDetail) {
  const doc = new jsPDF();
  const line = (text: string, y: number) => {
    doc.text(text, 20, y);
    return y + 7;
  };

  let y = 20;
  doc.setFontSize(16);
  y = line("Greenquote — Solar pre-qualification", y);
  y += 4;
  doc.setFontSize(10);
  y = line(`Reference: ${detail.id}`, y);
  y = line(`Created: ${formatDate(detail.createdAt)}`, y);
  y += 6;

  doc.setFontSize(12);
  y = line("Evaluation class (risk band)", y);
  doc.setFontSize(14);
  y = line(`Band ${detail.riskBand}`, y);
  y += 4;

  doc.setFontSize(12);
  y = line("Indicative system price", y);
  doc.setFontSize(14);
  y = line(formatCurrency(detail.systemPrice), y);
  y += 6;

  doc.setFontSize(12);
  y = line("Project", y);
  doc.setFontSize(10);
  y = line(`Address: ${detail.address}`, y);
  y = line(`Contact: ${detail.fullName} · ${detail.email}`, y);
  y = line(`Monthly consumption: ${detail.monthlyConsumptionKwh} kWh`, y);
  y = line(`System size: ${detail.systemSizeKw} kW`, y);
  if (detail.downPayment != null && detail.downPayment > 0) {
    y = line(`Down payment: ${formatCurrency(detail.downPayment)}`, y);
  }
  y += 6;

  doc.setFontSize(12);
  y = line("Installment offers", y);
  doc.setFontSize(10);
  for (const o of detail.installmentOffers) {
    const extra =
      o.apr != null && o.principalUsd != null
        ? ` — ${formatCurrency(o.principalUsd)} financed at ${o.apr.toFixed(2)}% APR`
        : "";
    y = line(
      `${o.termYears} years: ${formatCurrency(o.monthlyPayment)} / month${extra}`,
      y,
    );
  }

  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(100);
  line(
    "Indicative only — not a binding offer. Greenquote / demo document.",
    y,
  );

  doc.save(`greenquote-quote-${detail.id}.pdf`);
}
