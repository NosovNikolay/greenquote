import { auth } from "@/auth";
import { formatInstallationAddress } from "@/lib/address";
import { computePreQualification } from "@/lib/pricing";
import { saveQuote } from "@/lib/quote-store";
import { createServerSdk } from "@/lib/api/server-sdk";
import { quoteFormSchema } from "@/lib/validation/quote";
import type { components } from "@greenquote/sdk";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type QuoteOffer = components["schemas"]["QuoteOffer"];

function formatUpstreamErrorMessage(error: unknown): string {
  if (error == null) {
    return "Upstream error";
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && "message" in error) {
    const m = (error as { message: unknown }).message;
    if (typeof m === "string") {
      return m;
    }
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Upstream error";
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = quoteFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const body = parsed.data;
  const installationAddress = formatInstallationAddress(
    body.streetLine,
    body.city,
    body.country,
  );
  const sdk = createServerSdk(req);

  if (sdk) {
    const { data, error, response } = await sdk.POST("/quotes", {
      body: {
        monthlyConsumptionKwh: body.monthlyConsumptionKwh,
        systemSizeKw: body.systemSizeKw,
        downPayment: body.downPayment ?? 0,
        installationAddress,
      },
    });

    if (response.ok && data) {
      return NextResponse.json(
        {
          quoteId: data.id,
          systemPrice: data.derived.systemPriceUsd,
          riskBand: data.derived.riskBand,
          installmentOffers: data.offers.map((o: QuoteOffer) => ({
            termYears: o.termYears as 5 | 10 | 15,
            monthlyPayment: o.monthlyPayment,
            apr: o.apr,
            principalUsd: o.principalUsed,
          })),
        },
        { status: 201 },
      );
    }

    // openapi-fetch already read the body into `error`; do not call response.text().
    const message = formatUpstreamErrorMessage(error);
    return NextResponse.json(
      { error: message, details: error },
      { status: response.status >= 400 ? response.status : 502 },
    );
  }

  const { systemPrice, riskBand, installmentOffers } =
    computePreQualification({
      systemSizeKw: body.systemSizeKw,
      monthlyConsumptionKwh: body.monthlyConsumptionKwh,
      downPayment: body.downPayment,
    });

  const quoteId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  saveQuote({
    id: quoteId,
    createdAt,
    userId: session.user.id,
    userEmail: body.email,
    userName: body.fullName,
    address: installationAddress,
    streetLine: body.streetLine,
    city: body.city,
    country: body.country,
    monthlyConsumptionKwh: body.monthlyConsumptionKwh,
    systemSizeKw: body.systemSizeKw,
    downPayment: body.downPayment,
    systemPrice,
    riskBand,
    installmentOffers,
    addressLat: body.addressLat ?? null,
    addressLon: body.addressLon ?? null,
  });

  return NextResponse.json(
    {
      quoteId,
      systemPrice,
      riskBand,
      installmentOffers,
    },
    { status: 201 },
  );
}
