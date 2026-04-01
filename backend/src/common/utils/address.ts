/**
 * Trailing segment looks like ISO 3166-1 alpha-2 (e.g. "Berlin, DE" or "5 Demo Str., Berlin, DE").
 * In that case the city is almost always the segment before it, not the code.
 */
function isIso3166Alpha2CountrySuffix(segment: string): boolean {
  const s = segment.trim();
  return s.length === 2 && /^[A-Za-z]{2}$/.test(s);
}

/** Known country name segments — if the last part matches, prefer the previous segment as city. */
const COUNTRY_LAST_SEGMENT = new Set([
  'germany',
  'deutschland',
  'austria',
  'österreich',
  'switzerland',
  'schweiz',
  'france',
  'frankreich',
  'italy',
  'italien',
  'netherlands',
  'nederland',
  'belgium',
  'belgië',
  'belgien',
  'poland',
  'polen',
  'spain',
  'spanien',
]);

/** Best-effort city label from a free-form installation address. */
export function extractCityFromAddress(
  address: string | undefined,
): string | undefined {
  if (address == null || !address.trim()) return undefined;
  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return undefined;
  const last = parts[parts.length - 1] ?? '';
  const withoutZip = last.replace(/^\d{5}\s+/, '').trim();
  let candidate = withoutZip || last;

  const lastNorm = candidate.toLowerCase();
  const lastLooksLikeCountry =
    COUNTRY_LAST_SEGMENT.has(lastNorm) ||
    isIso3166Alpha2CountrySuffix(candidate);

  if (lastLooksLikeCountry && parts.length >= 2) {
    const prev = parts[parts.length - 2] ?? '';
    candidate = prev.replace(/^\d{5}\s+/, '').trim() || candidate;
  }

  return candidate || undefined;
}
