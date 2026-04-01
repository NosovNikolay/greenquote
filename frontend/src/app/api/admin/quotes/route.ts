import { auth } from "@/auth";
import { listAll } from "@/lib/quote-store";
import { createServerSdk } from "@/lib/api/server-sdk";
import { mapApiAdminRowToView } from "@/lib/api/map-quote";
import type { components } from "@greenquote/sdk";
import type { AdminQuoteRow } from "@/lib/api/types";

type ApiAdminRow = components["schemas"]["AdminQuoteRow"];
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
  if (sdk) {
    const { data, response } = await sdk.GET("/admin/quotes", {
      params: { query: q ? { q } : {} },
    });
    if (response.ok && data) {
      return NextResponse.json(
        data.map((row: ApiAdminRow) => mapApiAdminRowToView(row)),
      );
    }
    return NextResponse.json(
      { error: "Upstream error" },
      { status: response.status >= 400 ? response.status : 502 },
    );
  }

  const rows: AdminQuoteRow[] = listAll(q).map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    systemSizeKw: r.systemSizeKw,
    systemPrice: r.systemPrice,
    riskBand: r.riskBand,
    userEmail: r.userEmail,
    userName: r.userName,
  }));

  return NextResponse.json(rows);
}
