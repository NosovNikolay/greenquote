import { auth } from "@/auth";
import { createServerSdk } from "@/lib/api/server-sdk";
import { mapApiAdminRowToView } from "@/lib/api/map-quote";
import type { ApiAdminQuoteRow } from "@/lib/api/sdk-types";
import { upstreamErrorResponse } from "@/lib/api/upstream-response";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;

  const sdk = createServerSdk(req);
  const { data, response } = await sdk.GET("/admin/quotes", {
    params: { query: q ? { q } : {} },
  });
  if (response.ok && data) {
    return NextResponse.json(
      data.map((row: ApiAdminQuoteRow) => mapApiAdminRowToView(row)),
    );
  }
  return upstreamErrorResponse(response.status);
}
