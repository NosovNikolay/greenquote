import type { QuoteDetail } from "@/lib/api/types";
import { jsPDF } from "jspdf";

const COL = {
  primary: [13, 59, 44] as [number, number, number],
  accent: [45, 106, 79] as [number, number, number],
  foreground: [15, 31, 26] as [number, number, number],
  muted: [92, 111, 104] as [number, number, number],
  panel: [248, 250, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  border: [220, 228, 224] as [number, number, number],
};

const SITE_NAME = "Greenquote";
const SITE_URL = "greenquote.com";
const DOC_TITLE = "Pre-qualification summary";

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

function bandAccent(
  band: string,
): { fill: [number, number, number]; label: string } {
  switch (band) {
    case "A":
      return { fill: [16, 185, 129], label: "Band A — favourable" };
    case "B":
      return { fill: [245, 158, 11], label: "Band B — standard" };
    default:
      return { fill: [249, 115, 22], label: `Band ${band}` };
  }
}

function addressLines(detail: QuoteDetail): string[] {
  if (detail.streetLine && detail.city && detail.country) {
    return [
      detail.streetLine,
      `${detail.city}, ${detail.country}`,
    ];
  }
  return [detail.address];
}

function quotePdfFileName(detail: QuoteDetail): string {
  const d = new Date(detail.createdAt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const shortId = detail.id.replace(/-/g, "").slice(0, 8);
  return `Greenquote-plan-${y}-${m}-${day}-${shortId}.pdf`;
}

export function downloadQuotePdf(detail: QuoteDetail) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 0;

  const drawHeader = () => {
    const headerH = 42;
    doc.setFillColor(...COL.primary);
    doc.rect(0, 0, pageW, headerH, "F");

    doc.setTextColor(...COL.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(SITE_NAME, margin, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 220, 210);
    doc.text(SITE_URL, margin, 23);

    doc.setFontSize(10);
    doc.setTextColor(230, 242, 236);
    doc.text(DOC_TITLE, margin, 32);

    doc.setTextColor(...COL.foreground);
    y = headerH + 12;
  };

  const sectionTitle = (title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COL.accent);
    doc.text(title.toUpperCase(), margin, y);
    y += 2;
    doc.setDrawColor(...COL.border);
    doc.setLineWidth(0.35);
    doc.line(margin, y, margin + 42, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COL.foreground);
    doc.setFontSize(10);
  };

  const bodyLine = (text: string, indent = 0) => {
    const lines = doc.splitTextToSize(text, contentW - indent);
    for (const line of lines) {
      if (y > 275) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin + indent, y);
      y += 5;
    }
  };

  drawHeader();

  /* Meta strip */
  doc.setFillColor(...COL.panel);
  doc.roundedRect(margin, y - 4, contentW, 18, 2, 2, "F");
  doc.setDrawColor(...COL.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y - 4, contentW, 18, 2, 2, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COL.muted);
  doc.text("QUOTE REFERENCE", margin + 4, y + 2);
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COL.foreground);
  doc.text(detail.id, margin + 4, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COL.muted);
  doc.text("ISSUED", margin + contentW * 0.48, y + 2);
  doc.setFontSize(9);
  doc.setTextColor(...COL.foreground);
  doc.text(formatDate(detail.createdAt), margin + contentW * 0.48, y + 8);

  y += 22;

  /* Hero: evaluation + price */
  sectionTitle("Evaluation & pricing");
  const band = bandAccent(detail.riskBand);
  doc.setFillColor(...band.fill);
  doc.roundedRect(margin, y - 2, 52, 11, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`  ${band.label}`, margin + 2, y + 5);
  doc.setTextColor(...COL.foreground);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COL.muted);
  doc.text("Indicative system price", margin, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...COL.primary);
  doc.text(formatCurrency(detail.systemPrice), margin, y);
  y += 14;

  /* Project */
  sectionTitle("Project & contact");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COL.muted);
  doc.text("Installation address", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COL.foreground);
  for (const line of addressLines(detail)) {
    bodyLine(line);
  }
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COL.muted);
  doc.text("Contact", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COL.foreground);
  bodyLine(`${detail.fullName}  ·  ${detail.email}`);
  y += 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  bodyLine(
    `Monthly consumption: ${detail.monthlyConsumptionKwh} kWh  ·  System size: ${detail.systemSizeKw} kW`,
  );
  if (detail.downPayment != null && detail.downPayment > 0) {
    bodyLine(`Down payment: ${formatCurrency(detail.downPayment)}`);
  }
  y += 6;

  /* Installments */
  sectionTitle("Installment options");
  doc.setFontSize(9);
  for (const o of detail.installmentOffers) {
    const extra =
      o.apr != null && o.principalEur != null
        ? `  ·  ${formatCurrency(o.principalEur)} at ${o.apr.toFixed(2)}% APR`
        : "";
    bodyLine(
      `${o.termYears}-year term: ${formatCurrency(o.monthlyPayment)}/month${extra}`,
    );
  }
  y += 8;

  /* Footer disclaimer */
  if (y > 250) {
    doc.addPage();
    y = margin;
  }
  doc.setDrawColor(...COL.border);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...COL.muted);
  const disclaimer = doc.splitTextToSize(
    `Figures are indicative and do not constitute a binding offer or credit decision. ${SITE_NAME} (${SITE_URL}) — document generated for your records.`,
    contentW,
  );
  for (const line of disclaimer) {
    doc.text(line, margin, y);
    y += 3.5;
  }

  doc.save(quotePdfFileName(detail));
}
