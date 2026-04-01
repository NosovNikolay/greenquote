import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type NominatimItem = {
  display_name: string;
  lat: string;
  lon: string;
};

/** Proxies OpenStreetMap Nominatim (usage policy: low volume, identify app). */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return NextResponse.json([]);
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Greenquote/1.0 (https://github.com/greenquote)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding unavailable" },
        { status: 502 },
      );
    }
    const data = (await res.json()) as NominatimItem[];
    const out = data.map((item) => ({
      label: item.display_name,
      lat: Number.parseFloat(item.lat),
      lon: Number.parseFloat(item.lon),
    }));
    return NextResponse.json(out);
  } catch {
    return NextResponse.json(
      { error: "Geocoding failed" },
      { status: 502 },
    );
  }
}
