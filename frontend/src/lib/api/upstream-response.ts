import { NextResponse } from "next/server";

/** Standard JSON body when the Nest API call failed (openapi-fetch `response` not ok). */
export function upstreamErrorResponse(status: number): NextResponse {
  return NextResponse.json(
    { error: "Upstream error" },
    { status: status >= 400 ? status : 502 },
  );
}
