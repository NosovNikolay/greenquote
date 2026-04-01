import { auth } from "@/auth";
import { createServerSdk } from "@/lib/api/server-sdk";
import { mapApiQuoteDetailToView } from "@/lib/api/map-quote";
import { upstreamErrorResponse } from "@/lib/api/upstream-response";
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

  const { data, response } = await sdk.GET("/quotes/{id}", {
    params: { path: { id } },
  });
  if (response.ok && data) {
    return NextResponse.json(mapApiQuoteDetailToView(data));
  }
  if (response.status === 404) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return upstreamErrorResponse(response.status);
}
