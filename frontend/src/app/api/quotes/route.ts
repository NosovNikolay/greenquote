import { auth } from "@/auth";
import { createServerSdk } from "@/lib/api/server-sdk";
import { mapApiQuoteSummaryToView } from "@/lib/api/map-quote";
import type { ApiQuoteSummary } from "@/lib/api/sdk-types";
import { upstreamErrorResponse } from "@/lib/api/upstream-response";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sdk = createServerSdk(req);
  const { data, response } = await sdk.GET("/quotes");
  if (response.ok && data) {
    const rows = data.map((row: ApiQuoteSummary) =>
      mapApiQuoteSummaryToView(row),
    );
    return NextResponse.json(rows);
  }
  return upstreamErrorResponse(response.status);
}
