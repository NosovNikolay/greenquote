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

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    30,
    Math.max(1, parseInt(searchParams.get("limit") ?? "30", 10) || 30),
  );

  const sdk = createServerSdk(req);
  const { data, response } = await sdk.GET("/quotes", {
    params: { query: { page, limit } },
  });
  if (response.ok && data) {
    const items = data.items.map((row: ApiQuoteSummary) =>
      mapApiQuoteSummaryToView(row),
    );
    return NextResponse.json({
      items,
      total: data.total,
      page: data.page,
      limit: data.limit,
    });
  }
  return upstreamErrorResponse(response.status);
}
