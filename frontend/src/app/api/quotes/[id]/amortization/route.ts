import { auth } from "@/auth";
import { createServerSdk } from "@/lib/api/server-sdk";
import { upstreamErrorResponse } from "@/lib/api/upstream-response";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TERMS = new Set<number>([5, 10, 15]);

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const raw = new URL(req.url).searchParams.get("termYears");
  const termYears = raw === null ? NaN : parseInt(raw, 10);
  if (!Number.isInteger(termYears) || !TERMS.has(termYears)) {
    return NextResponse.json(
      { error: "termYears must be 5, 10, or 15" },
      { status: 400 },
    );
  }

  const sdk = createServerSdk(req);
  const { data, response } = await sdk.GET("/quotes/{id}/amortization", {
    params: {
      path: { id },
      query: { termYears: termYears as 5 | 10 | 15 },
    },
  });

  if (response.ok && data) {
    return NextResponse.json(data);
  }
  if (response.status === 404) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (response.status === 403) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return upstreamErrorResponse(response.status);
}
