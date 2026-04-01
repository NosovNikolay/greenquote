import { auth } from "@/auth";
import { listByUser } from "@/lib/quote-store";
import { createServerSdk } from "@/lib/api/server-sdk";
import { mapApiQuoteSummaryToView } from "@/lib/api/map-quote";
import type { components } from "@greenquote/sdk";
import type { QuoteSummary } from "@/lib/api/types";

type ApiQuoteSummary = components["schemas"]["QuoteSummary"];
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sdk = createServerSdk(req);
  if (sdk) {
    const { data, response } = await sdk.GET("/quotes");
    if (response.ok && data) {
      const rows = data.map((row: ApiQuoteSummary) =>
        mapApiQuoteSummaryToView(row),
      );
      return NextResponse.json(rows);
    }
    return NextResponse.json(
      { error: "Upstream error" },
      { status: response.status >= 400 ? response.status : 502 },
    );
  }

  const rows = listByUser(session.user.id).map(
    (q): QuoteSummary => ({
      id: q.id,
      createdAt: q.createdAt,
      systemSizeKw: q.systemSizeKw,
      systemPrice: q.systemPrice,
      riskBand: q.riskBand,
      userName: q.userName,
      userEmail: q.userEmail,
      city: q.city,
    }),
  );

  return NextResponse.json(rows);
}
