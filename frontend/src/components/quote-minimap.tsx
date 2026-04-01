"use client";

import { useEffect, useState } from "react";

type Props = {
  address: string;
  lat?: number | null;
  lon?: number | null;
};

export function QuoteMinimap({ address, lat, lon }: Props) {
  const [resolved, setResolved] = useState<{
    lat: number;
    lon: number;
  } | null>(() =>
    lat != null && lon != null ? { lat, lon } : null,
  );

  useEffect(() => {
    if (lat != null && lon != null) {
      setResolved({ lat, lon });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/geocode/lookup?q=${encodeURIComponent(address)}`,
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          lat: number | null;
          lon: number | null;
        };
        if (
          data.lat != null &&
          data.lon != null &&
          !Number.isNaN(data.lat) &&
          !Number.isNaN(data.lon)
        ) {
          setResolved({ lat: data.lat, lon: data.lon });
        }
      } catch {
        /* minimap optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address, lat, lon]);

  if (!resolved) {
    return (
      <div className="flex aspect-[5/3] max-h-[220px] w-full items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--card-border)] bg-[#fafcfb] text-center text-xs text-[var(--muted)]">
        Map unavailable — add a geocoded address next time, or try again later.
      </div>
    );
  }

  const { lat: la, lon: lo } = resolved;
  const d = 0.01;
  const bbox = `${lo - d},${la - d},${lo + d},${la + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${encodeURIComponent(`${la},${lo}`)}`;

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--card-border)] shadow-[var(--shadow-soft)]">
      <iframe
        title="Installation location"
        className="aspect-[5/3] h-[220px] w-full max-w-full border-0"
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <p className="border-t border-[var(--card-border)] bg-[#fafcfb] px-3 py-2 text-[10px] text-[var(--muted)]">
        ©{" "}
        <a
          className="text-[var(--accent)] underline-offset-2 hover:underline"
          href="https://www.openstreetmap.org/"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap
        </a>{" "}
        contributors
      </p>
    </div>
  );
}
