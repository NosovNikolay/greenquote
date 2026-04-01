import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Single best match for an address string (e.g. detail page minimap fallback). */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 5) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Greenquote/1.0 (https://github.com/greenquote)",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding unavailable" },
        { status: 502 },
      );
    }
    const data = (await res.json()) as { lat: string; lon: string }[];
    const first = data[0];
    if (!first) {
      return NextResponse.json({ lat: null, lon: null });
    }
    return NextResponse.json({
      lat: Number.parseFloat(first.lat),
      lon: Number.parseFloat(first.lon),
    });
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }
}
