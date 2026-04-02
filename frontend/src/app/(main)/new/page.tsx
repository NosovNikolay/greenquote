import { QuoteForm } from "@/components/quote-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solar pre-qualification | Greenquote",
  description: "Request a residential solar pre-qualification quote.",
};

export default function NewQuotePage() {
  return <QuoteForm />;
}
