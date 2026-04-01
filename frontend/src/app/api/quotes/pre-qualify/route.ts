import { auth } from "@/auth";
import { formatInstallationAddress } from "@/lib/address";
import { createServerSdk } from "@/lib/api/server-sdk";
import { mapNestCreateQuoteToPreQualify } from "@/lib/api/map-quote";
import { formatUpstreamErrorMessage } from "@/lib/api/upstream-error";
import { quoteFormSchema } from "@/lib/validation/quote";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  const { data, error, response } = await sdk.POST("/quotes", {
    body: {
      monthlyConsumptionKwh: body.monthlyConsumptionKwh,
      systemSizeKw: body.systemSizeKw,
      downPayment: body.downPayment ?? 0,
      installationAddress,
    },
  });

  if (response.ok && data) {
    return NextResponse.json(mapNestCreateQuoteToPreQualify(data), {
      status: 201,
    });
  }

  const message = formatUpstreamErrorMessage(error);
  return NextResponse.json(
    { error: message, details: error },
    { status: response.status >= 400 ? response.status : 502 },
  );
}
