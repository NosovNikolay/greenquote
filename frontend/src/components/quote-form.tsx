"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import { quoteFormSchema, type QuoteFormValues } from "@/lib/validation/quote";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

type GeoStructuredResponse =
  | { found: true; lat: number; lon: number }
  | { found: false; lat: null; lon: null }
  | { error?: string };

async function lookupStructuredAddress(
  streetLine: string,
  city: string,
  country: string,
): Promise<{ lat?: number; lon?: number }> {
  const params = new URLSearchParams({
    street: streetLine,
    city,
    country,
  });
  try {
    const res = await fetch(`/api/geocode/structured?${params.toString()}`);
    const data = (await res.json()) as GeoStructuredResponse;
    if (!res.ok) {
      return {};
    }
    if ("error" in data && data.error) {
      return {};
    }
    if ("found" in data && data.found && data.lat != null && data.lon != null) {
      return { lat: data.lat, lon: data.lon };
    }
  } catch {
    /* treat as not found */
  }
  return {};
}

export function QuoteForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [addressConfirmOpen, setAddressConfirmOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<QuoteFormValues | null>(
    null,
  );

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema) as Resolver<QuoteFormValues>,
    defaultValues: {
      fullName: "",
      email: "",
      streetLine: "",
      city: "",
      country: "",
      monthlyConsumptionKwh: undefined as unknown as number,
      systemSizeKw: undefined as unknown as number,
      downPayment: undefined,
      addressLat: undefined,
      addressLon: undefined,
      confirmedUnverifiedAddress: undefined,
    },
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      form.setValue("email", session.user.email ?? "");
      form.setValue("fullName", session.user.name ?? "");
    }
  }, [status, session, form]);

  async function runQualification(values: QuoteFormValues) {
    setSubmitError(null);
    setProgressLabel("Checking your inputs…");
    try {
      await delay(350);
      setProgressLabel("Running pricing model…");
      const res = await api.preQualify({
        fullName: values.fullName,
        email: values.email,
        streetLine: values.streetLine,
        city: values.city,
        country: values.country,
        monthlyConsumptionKwh: values.monthlyConsumptionKwh,
        systemSizeKw: values.systemSizeKw,
        downPayment: values.downPayment,
        addressLat: values.addressLat,
        addressLon: values.addressLon,
        confirmedUnverifiedAddress: values.confirmedUnverifiedAddress,
      });
      setProgressLabel("Finalizing your quote…");
      await delay(450);
      router.push(`/quotes/${res.quoteId}`);
      router.refresh();
    } catch (e) {
      setProgressLabel(null);
      setSubmitError(e instanceof Error ? e.message : "Request failed");
    }
  }

  async function onSubmit(values: QuoteFormValues) {
    if (addressConfirmOpen) return;
    setSubmitError(null);

    const { lat, lon } = await lookupStructuredAddress(
      values.streetLine,
      values.city,
      values.country,
    );

    if (lat != null && lon != null) {
      await runQualification({
        ...values,
        addressLat: lat,
        addressLon: lon,
        confirmedUnverifiedAddress: undefined,
      });
      return;
    }

    setPendingSubmit(values);
    setAddressConfirmOpen(true);
  }

  async function confirmUnverifiedAddress() {
    if (!pendingSubmit) return;
    setAddressConfirmOpen(false);
    const values = pendingSubmit;
    setPendingSubmit(null);
    await runQualification({
      ...values,
      addressLat: undefined,
      addressLon: undefined,
      confirmedUnverifiedAddress: true,
    });
  }

  function cancelAddressConfirm() {
    setAddressConfirmOpen(false);
    setPendingSubmit(null);
  }

  const busy = form.formState.isSubmitting || progressLabel != null;

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {busy ? (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[var(--radius-lg)] bg-white/80 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent-soft)] border-t-[var(--accent)]" />
          <p className="mt-4 text-sm font-medium text-[var(--primary)]">
            {progressLabel ?? "Working…"}
          </p>
        </div>
      ) : null}

      <section aria-labelledby="quote-form-title">
        <Card>
          <CardTitle id="quote-form-title" className="mb-1">
            Residential solar pre-qualification
          </CardTitle>
          <p className="mb-6 text-sm text-[var(--muted)]">
            Enter your installation address in separate fields. We verify it
            against OpenStreetMap; if we cannot find a match, you can confirm
            the address is correct before continuing.
          </p>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            {submitError ? (
              <div
                role="alert"
                className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
              >
                {submitError}
              </div>
            ) : null}

            {addressConfirmOpen ? (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="address-confirm-title"
                className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
              >
                <p id="address-confirm-title" className="font-semibold">
                  We could not verify this address
                </p>
                <p className="mt-2 text-amber-900/90">
                  Our map service did not return a location for the street,
                  city, and country you entered. You can go back and edit the
                  fields, or confirm that the address is correct as entered —
                  your quote will still be created, but the map may be less
                  precise.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={cancelAddressConfirm}>
                    Edit address
                  </Button>
                  <Button type="button" onClick={() => void confirmUnverifiedAddress()}>
                    Yes, the address is correct
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  autoComplete="name"
                  invalid={!!form.formState.errors.fullName}
                  {...form.register("fullName")}
                />
                {form.formState.errors.fullName ? (
                  <p className="text-xs text-[var(--danger)]" role="alert">
                    {form.formState.errors.fullName.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  readOnly
                  aria-readonly="true"
                  className="bg-[var(--accent-soft)]/50"
                  invalid={!!form.formState.errors.email}
                  {...form.register("email")}
                />
                <p className="text-xs text-[var(--muted)]">
                  Pre-filled from your account.
                </p>
                {form.formState.errors.email ? (
                  <p className="text-xs text-[var(--danger)]" role="alert">
                    {form.formState.errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="streetLine">Street and house number</Label>
                <Input
                  id="streetLine"
                  autoComplete="address-line1"
                  invalid={!!form.formState.errors.streetLine}
                  {...form.register("streetLine")}
                />
                {form.formState.errors.streetLine ? (
                  <p className="text-xs text-[var(--danger)]" role="alert">
                    {form.formState.errors.streetLine.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  autoComplete="address-level2"
                  invalid={!!form.formState.errors.city}
                  {...form.register("city")}
                />
                {form.formState.errors.city ? (
                  <p className="text-xs text-[var(--danger)]" role="alert">
                    {form.formState.errors.city.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  autoComplete="country-name"
                  invalid={!!form.formState.errors.country}
                  {...form.register("country")}
                />
                {form.formState.errors.country ? (
                  <p className="text-xs text-[var(--danger)]" role="alert">
                    {form.formState.errors.country.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="monthlyConsumptionKwh">
                  Monthly consumption (kWh)
                </Label>
                <Input
                  id="monthlyConsumptionKwh"
                  inputMode="decimal"
                  invalid={!!form.formState.errors.monthlyConsumptionKwh}
                  {...form.register("monthlyConsumptionKwh")}
                />
                {form.formState.errors.monthlyConsumptionKwh ? (
                  <p className="text-xs text-[var(--danger)]" role="alert">
                    {form.formState.errors.monthlyConsumptionKwh.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="systemSizeKw">System size (kW)</Label>
                <Input
                  id="systemSizeKw"
                  inputMode="decimal"
                  invalid={!!form.formState.errors.systemSizeKw}
                  {...form.register("systemSizeKw")}
                />
                {form.formState.errors.systemSizeKw ? (
                  <p className="text-xs text-[var(--danger)]" role="alert">
                    {form.formState.errors.systemSizeKw.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="downPayment">
                  Down payment (optional, EUR)
                </Label>
                <Input
                  id="downPayment"
                  inputMode="decimal"
                  placeholder="0"
                  invalid={!!form.formState.errors.downPayment}
                  {...form.register("downPayment")}
                />
                {form.formState.errors.downPayment ? (
                  <p className="text-xs text-[var(--danger)]" role="alert">
                    {String(form.formState.errors.downPayment.message)}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                type="submit"
                disabled={busy || addressConfirmOpen}
                className="min-h-11 min-w-[200px]"
              >
                Get pre-qualification
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
}
