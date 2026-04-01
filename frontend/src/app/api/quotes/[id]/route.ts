import { auth } from "@/auth";
import { getQuote } from "@/lib/quote-store";
import { createServerSdk } from "@/lib/api/server-sdk";
import { mapApiQuoteDetailToView } from "@/lib/api/map-quote";
import type { QuoteDetail } from "@/lib/api/types";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sdk = createServerSdk(req);

  if (sdk) {
    const { data, response } = await sdk.GET("/quotes/{id}", {
      params: { path: { id } },
    });
    if (response.ok && data) {
      return NextResponse.json(mapApiQuoteDetailToView(data));
    }
    if (response.status === 404) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Upstream error" },
      { status: response.status >= 400 ? response.status : 502 },
    );
  }

  const row = getQuote(id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = row.userId === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const detail: QuoteDetail = {
    id: row.id,
    createdAt: row.createdAt,
    systemSizeKw: row.systemSizeKw,
    systemPrice: row.systemPrice,
    riskBand: row.riskBand,
    fullName: row.userName,
    email: row.userEmail,
    address: row.address,
    streetLine: row.streetLine,
    city: row.city,
    country: row.country,
    monthlyConsumptionKwh: row.monthlyConsumptionKwh,
    downPayment: row.downPayment,
    installmentOffers: row.installmentOffers,
    addressLat: row.addressLat ?? null,
    addressLon: row.addressLon ?? null,
  };

  return NextResponse.json(detail);
}
