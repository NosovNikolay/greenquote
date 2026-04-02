import { NextResponse } from "next/server";

export function upstreamErrorResponse(status: number): NextResponse {
  return NextResponse.json(
    { error: "Upstream error" },
    { status: status >= 400 ? status : 502 },
  );
}
