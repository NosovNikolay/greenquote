import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Structured Nominatim search (street + city + country).
 * Returns first match coordinates or null when nothing is found.
 */
export async function GET(req: NextRequest) {
  const street = req.nextUrl.searchParams.get("street")?.trim() ?? "";
  const city = req.nextUrl.searchParams.get("city")?.trim() ?? "";
  const country = req.nextUrl.searchParams.get("country")?.trim() ?? "";

  if (street.length < 2 || city.length < 2 || country.length < 2) {
    return NextResponse.json(
      { error: "street, city, and country are required" },
      { status: 400 },
    );
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("street", street);
  url.searchParams.set("city", city);
  url.searchParams.set("country", country);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");

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
    let data = (await res.json()) as { lat: string; lon: string }[];
    let first = data[0];
    if (!first) {
      const qUrl = new URL("https://nominatim.openstreetmap.org/search");
      qUrl.searchParams.set(
        "q",
        [street, city, country].join(", "),
      );
      qUrl.searchParams.set("format", "json");
      qUrl.searchParams.set("limit", "1");
      const qRes = await fetch(qUrl.toString(), {
        headers: {
          "User-Agent": "Greenquote/1.0 (https://github.com/greenquote)",
          Accept: "application/json",
        },
        next: { revalidate: 0 },
      });
      if (qRes.ok) {
        data = (await qRes.json()) as { lat: string; lon: string }[];
        first = data[0];
      }
    }
    if (!first) {
      return NextResponse.json({ found: false as const, lat: null, lon: null });
    }
    return NextResponse.json({
      found: true as const,
      lat: Number.parseFloat(first.lat),
      lon: Number.parseFloat(first.lon),
    });
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }
}
